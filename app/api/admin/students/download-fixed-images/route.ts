import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import archiver from 'archiver';
import schoolsData from '@/data.json';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

// Process images in chunks
const CHUNK_SIZE = 5000;
const ID_BATCH_SIZE = 1000;

interface SchoolDataEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const chunkIndex = parseInt(searchParams.get('chunk') || '0');
  const getTotalChunks = searchParams.get('totalChunks') === 'true';

  console.log(`🚀 Starting FIXED image download for 047xxxx and 058xxxx - chunk: ${chunkIndex}`);

  try {
    // Get all IDs for students with student numbers starting with 047 or 058
    let studentIds: Array<{ id: string; studentNumber: string }> = [];
    let postIds: Array<{ id: string; studentNumber: string }> = [];

    // Fetch StudentRegistrations with 047xxxx or 058xxxx
    const studentRegs047 = await prisma.studentRegistration.findMany({
      where: {
        studentNumber: { startsWith: '047' },
        passport: { not: null },
      },
      select: { id: true, studentNumber: true },
      orderBy: { studentNumber: 'asc' },
    });

    const studentRegs058 = await prisma.studentRegistration.findMany({
      where: {
        studentNumber: { startsWith: '058' },
        passport: { not: null },
      },
      select: { id: true, studentNumber: true },
      orderBy: { studentNumber: 'asc' },
    });

    studentIds = [...studentRegs047, ...studentRegs058];

    // Fetch PostRegistrations with 047xxxx or 058xxxx
    const postRegs047 = await prisma.postRegistration.findMany({
      where: {
        studentNumber: { startsWith: '047' },
        passport: { not: null },
      },
      select: { id: true, studentNumber: true },
      orderBy: { studentNumber: 'asc' },
    });

    const postRegs058 = await prisma.postRegistration.findMany({
      where: {
        studentNumber: { startsWith: '058' },
        passport: { not: null },
      },
      select: { id: true, studentNumber: true },
      orderBy: { studentNumber: 'asc' },
    });

    postIds = [...postRegs047, ...postRegs058];

    const totalImages = studentIds.length + postIds.length;

    if (totalImages === 0) {
      return NextResponse.json({ error: 'No students with 047xxxx or 058xxxx exam numbers found with images' }, { status: 404 });
    }

    const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);

    if (getTotalChunks) {
      return NextResponse.json({
        totalImages,
        totalChunks,
        chunkSize: CHUNK_SIZE,
        studentCount047: studentRegs047.length,
        studentCount058: studentRegs058.length,
        postCount047: postRegs047.length,
        postCount058: postRegs058.length,
      });
    }

    if (chunkIndex < 0 || chunkIndex >= totalChunks) {
      return NextResponse.json({ error: 'Invalid chunk index' }, { status: 400 });
    }

    // Calculate which IDs to fetch for this chunk
    const startIdx = chunkIndex * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalImages);

    const chunkStudentIds: typeof studentIds = [];
    const chunkPostIds: typeof postIds = [];

    for (let i = startIdx; i < endIdx; i++) {
      if (i < studentIds.length) {
        chunkStudentIds.push(studentIds[i]);
      } else {
        const postIdx = i - studentIds.length;
        if (postIdx < postIds.length) {
          chunkPostIds.push(postIds[postIdx]);
        }
      }
    }

    console.log(`📦 Processing chunk ${chunkIndex + 1}/${totalChunks}: ${chunkStudentIds.length + chunkPostIds.length} images`);

    // Create archive
    const archive = archiver('zip', {
      zlib: { level: 3 },
    });

    const chunks: Buffer[] = [];
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('error', (err: Error) => { throw err; });

    let processedCount = 0;
    let errorCount = 0;

    // Load schools data for prefix lookup
    const schools = schoolsData as SchoolDataEntry[];

    // Process StudentRegistrations
    if (chunkStudentIds.length > 0) {
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
                lgaCode: true,
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

            // Generate FIXED exam number
            // Extract the last 4 digits from current studentNumber
            const currentNumber = student.studentNumber;
            const sequence = currentNumber.slice(-4);
            
            // Get the correct LGA and school codes from school data
            const schoolInfo = schools.find(
              (s) => s.lCode === student.school.lgaCode && s.schCode === student.school.schoolCode
            );
            
            let fixedExamNumber: string;
            if (schoolInfo) {
              // Use sequential LGA code and padded school code
              const seqLgaCode = schoolInfo.lgaCode;
              const seqSchCode = schoolInfo.schCode.padStart(3, '0');
              fixedExamNumber = `${seqLgaCode}${seqSchCode}${sequence}`;
            } else {
              // Fallback: use last 4 digits with a prefix indicating it needs review
              fixedExamNumber = `FIXED_${sequence}`;
            }

            const filename = `${fixedExamNumber}.${fileExtension}`;
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

    // Process PostRegistrations
    if (chunkPostIds.length > 0) {
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
                lgaCode: true,
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

            // Generate FIXED exam number
            const currentNumber = student.studentNumber;
            const sequence = currentNumber.slice(-4);
            
            const schoolInfo = schools.find(
              (s) => s.lCode === student.school.lgaCode && s.schCode === student.school.schoolCode
            );
            
            let fixedExamNumber: string;
            if (schoolInfo) {
              const seqLgaCode = schoolInfo.lgaCode;
              const seqSchCode = schoolInfo.schCode.padStart(3, '0');
              fixedExamNumber = `${seqLgaCode}${seqSchCode}${sequence}`;
            } else {
              fixedExamNumber = `FIXED_${sequence}`;
            }

            const filename = `${fixedExamNumber}.${fileExtension}`;
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

    await archive.finalize();
    const zipBuffer = Buffer.concat(chunks);

    console.log(`✅ Fixed chunk ${chunkIndex + 1} complete: ${processedCount} images (${errorCount} errors), ${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB`);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `fixed_images_047_058_${timestamp}_part${chunkIndex + 1}of${totalChunks}.zip`;

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
    console.error('❌ Fixed download failed:', error);
    return NextResponse.json(
      { error: 'Failed to generate fixed image archive', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
