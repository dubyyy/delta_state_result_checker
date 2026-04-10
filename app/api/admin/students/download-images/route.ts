import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Process images in chunks to handle 60,000+ images
const CHUNK_SIZE = 5000; // Images per ZIP chunk (approx 250MB if 50KB per image)
const ID_BATCH_SIZE = 1000; // Max IDs to query at once (Prisma parameter limit)

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const lga = searchParams.get('lga');
  const schoolCode = searchParams.get('schoolCode');
  const registrationType = searchParams.get('registrationType');
  const search = searchParams.get('search');
  const chunkIndex = parseInt(searchParams.get('chunk') || '0');
  const getTotalChunks = searchParams.get('totalChunks') === 'true';

  console.log(`🚀 Starting image download - chunk: ${chunkIndex}`);

  try {
    // Build filter conditions
    const studentRegWhere: any = {};
    const postRegWhere: any = {};

    if (search) {
      const searchConditions = {
        OR: [
          { firstname: { contains: search, mode: 'insensitive' } },
          { lastname: { contains: search, mode: 'insensitive' } },
          { studentNumber: { contains: search, mode: 'insensitive' } },
        ],
      };
      studentRegWhere.AND = [searchConditions];
      postRegWhere.AND = [searchConditions];
    }

    if (schoolCode) {
      studentRegWhere.school = { schoolCode };
      postRegWhere.school = { schoolCode };
    }

    // Get all IDs first (lightweight query)
    let studentIds: Array<{ id: string; lateRegistration: boolean }> = [];
    let postIds: Array<{ id: string }> = [];

    if (!registrationType || registrationType === 'all' || registrationType === 'regular' || registrationType === 'late') {
      studentIds = await prisma.studentRegistration.findMany({
        where: {
          ...studentRegWhere,
          passport: { not: null },
        },
        select: { id: true, lateRegistration: true },
        orderBy: { id: 'asc' },
      });

      // Filter by registration type
      if (registrationType === 'regular') {
        studentIds = studentIds.filter(s => !s.lateRegistration);
      } else if (registrationType === 'late') {
        studentIds = studentIds.filter(s => s.lateRegistration);
      }
    }

    if (!registrationType || registrationType === 'all' || registrationType === 'post') {
      postIds = await prisma.postRegistration.findMany({
        where: {
          ...postRegWhere,
          passport: { not: null },
        },
        select: { id: true },
        orderBy: { id: 'asc' },
      });
    }

    const totalImages = studentIds.length + postIds.length;

    if (totalImages === 0) {
      return NextResponse.json({ error: 'No students with images found' }, { status: 404 });
    }

    // Calculate total chunks
    const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);

    // If just getting total chunks info
    if (getTotalChunks) {
      return NextResponse.json({
        totalImages,
        totalChunks,
        chunkSize: CHUNK_SIZE,
      });
    }

    // Validate chunk index
    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      return NextResponse.json({ error: 'Invalid chunk index' }, { status: 400 });
    }

    // Calculate which IDs to fetch for this chunk
    const startIdx = chunkIndex * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalImages);

    // Determine which IDs belong to this chunk
    // Strategy: Students first, then PostRegistrations
    const chunkStudentIds: typeof studentIds = [];
    const chunkPostIds: typeof postIds = [];
    
    // Calculate range for this chunk across the combined dataset
    for (let i = startIdx; i < endIdx; i++) {
      if (i < studentIds.length) {
        // This index is within the student IDs range
        chunkStudentIds.push(studentIds[i]);
      } else {
        // This index is within the post registration IDs range
        const postIdx = i - studentIds.length;
        if (postIdx < postIds.length) {
          chunkPostIds.push(postIds[postIdx]);
        }
      }
    }

    console.log(`📦 Processing chunk ${chunkIndex + 1}/${totalChunks}: ${chunkStudentIds.length + chunkPostIds.length} images`);

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 3 }, // Lower compression for speed
    });

    // Collect chunks for response
    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));

    archive.on('error', (err: Error) => {
      throw err;
    });

    let processedCount = 0;
    let errorCount = 0;

    // Process StudentRegistrations for this chunk (in ID batches of 1000)
    if (chunkStudentIds.length > 0) {
      console.log(`  📥 Fetching ${chunkStudentIds.length} student registrations in batches of ${ID_BATCH_SIZE}...`);

      // Process IDs in smaller batches to avoid Prisma parameter limits
      for (let i = 0; i < chunkStudentIds.length; i += ID_BATCH_SIZE) {
        const idBatch = chunkStudentIds.slice(i, i + ID_BATCH_SIZE);

        const students = await prisma.studentRegistration.findMany({
          where: {
            id: { in: idBatch.map(s => s.id) },
          },
          select: {
            studentNumber: true,
            firstname: true,
            lastname: true,
            passport: true,
            school: {
              select: {
                schoolCode: true,
              },
            },
          },
        });

        for (const student of students) {
          try {
            if (!student.passport) continue;

            let base64Data: string;
            let fileExtension = 'jpg';

            if (student.passport.startsWith('data:image/')) {
              const matches = student.passport.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                fileExtension = matches[1];
                base64Data = matches[2];
              } else {
                const parts = student.passport.split(',');
                if (parts.length === 2) {
                  base64Data = parts[1];
                } else {
                  errorCount++;
                  continue;
                }
              }
            } else {
              base64Data = student.passport;
            }

            const filename = `${student.studentNumber}.${fileExtension}`;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            archive.append(imageBuffer, { name: filename });
            processedCount++;
          } catch (error) {
            console.error(`Error processing ${student.studentNumber}:`, error);
            errorCount++;
          }
        }
      }
    }

    // Process PostRegistrations for this chunk (in ID batches of 1000)
    if (chunkPostIds.length > 0) {
      console.log(`  📥 Fetching ${chunkPostIds.length} post registrations in batches of ${ID_BATCH_SIZE}...`);

      // Process IDs in smaller batches to avoid Prisma parameter limits
      for (let i = 0; i < chunkPostIds.length; i += ID_BATCH_SIZE) {
        const idBatch = chunkPostIds.slice(i, i + ID_BATCH_SIZE);

        const students = await prisma.postRegistration.findMany({
          where: {
            id: { in: idBatch.map(s => s.id) },
          },
          select: {
            studentNumber: true,
            firstname: true,
            lastname: true,
            passport: true,
            school: {
              select: {
                schoolCode: true,
              },
            },
          },
        });

        for (const student of students) {
          try {
            if (!student.passport) continue;

            let base64Data: string;
            let fileExtension = 'jpg';

            if (student.passport.startsWith('data:image/')) {
              const matches = student.passport.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
              if (matches && matches.length === 3) {
                fileExtension = matches[1];
                base64Data = matches[2];
              } else {
                const parts = student.passport.split(',');
                if (parts.length === 2) {
                  base64Data = parts[1];
                } else {
                  errorCount++;
                  continue;
                }
              }
            } else {
              base64Data = student.passport;
            }

            const filename = `${student.studentNumber}.${fileExtension}`;
            const imageBuffer = Buffer.from(base64Data, 'base64');
            archive.append(imageBuffer, { name: filename });
            processedCount++;
          } catch (error) {
            console.error(`Error processing ${student.studentNumber}:`, error);
            errorCount++;
          }
        }
      }
    }

    // Finalize archive
    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);

    console.log(`✅ Chunk ${chunkIndex + 1} complete: ${processedCount} images (${errorCount} errors), ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `student_images_${timestamp}_part${chunkIndex + 1}of${totalChunks}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-Chunk-Index': chunkIndex.toString(),
        'X-Total-Chunks': totalChunks.toString(),
        'X-Total-Images': totalImages.toString(),
        'X-Chunk-Images': processedCount.toString(),
        'X-Failed-Images': errorCount.toString(),
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ Download failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate image archive', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

