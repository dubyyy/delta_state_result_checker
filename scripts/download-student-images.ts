import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

interface ImageDownloadStats {
  totalStudents: number;
  studentsWithImages: number;
  studentsWithoutImages: number;
  imagesDownloaded: number;
  errors: number;
}

async function downloadStudentImages() {
  console.log('🚀 Starting student image download process...\n');

  const stats: ImageDownloadStats = {
    totalStudents: 0,
    studentsWithImages: 0,
    studentsWithoutImages: 0,
    imagesDownloaded: 0,
    errors: 0,
  };

  // Create output directory
  const outputDir = path.join(process.cwd(), 'student-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`✅ Created output directory: ${outputDir}\n`);
  }

  try {
    // Fetch all students from StudentRegistration
    console.log('📥 Fetching students from StudentRegistration table...');
    const studentRegistrations = await prisma.studentRegistration.findMany({
      select: {
        id: true,
        studentNumber: true,
        firstname: true,
        lastname: true,
        passport: true,
      },
    });
    console.log(`   Found ${studentRegistrations.length} students in StudentRegistration\n`);

    // Fetch all students from PostRegistration
    console.log('📥 Fetching students from PostRegistration table...');
    const postRegistrations = await prisma.postRegistration.findMany({
      select: {
        id: true,
        studentNumber: true,
        firstname: true,
        lastname: true,
        passport: true,
      },
    });
    console.log(`   Found ${postRegistrations.length} students in PostRegistration\n`);

    const allStudents = [
      ...studentRegistrations.map(s => ({ ...s, source: 'StudentRegistration' })),
      ...postRegistrations.map(s => ({ ...s, source: 'PostRegistration' })),
    ];

    stats.totalStudents = allStudents.length;
    console.log(`📊 Total students to process: ${stats.totalStudents}\n`);
    console.log('⏳ Processing images...\n');

    let processedCount = 0;
    const batchSize = 100;

    for (const student of allStudents) {
      processedCount++;

      try {
        if (!student.passport) {
          stats.studentsWithoutImages++;
          continue;
        }

        stats.studentsWithImages++;

        // Extract base64 data from data URL
        let base64Data: string;
        let fileExtension = 'jpg'; // default

        if (student.passport.startsWith('data:image/')) {
          // Format: data:image/png;base64,iVBORw0KG...
          const matches = student.passport.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            fileExtension = matches[1];
            base64Data = matches[2];
          } else {
            // Try simpler match
            const parts = student.passport.split(',');
            if (parts.length === 2) {
              base64Data = parts[1];
            } else {
              throw new Error('Invalid base64 format');
            }
          }
        } else {
          // Assume it's already base64 without the data URL prefix
          base64Data = student.passport;
        }

        // Create filename: studentNumber_lastname_firstname.ext
        const sanitizedName = `${student.studentNumber}_${student.lastname}_${student.firstname}`
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .substring(0, 100); // Limit filename length
        
        const filename = `${sanitizedName}.${fileExtension}`;
        const filepath = path.join(outputDir, filename);

        // Write image file
        const buffer = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(filepath, buffer);

        stats.imagesDownloaded++;

        // Progress indicator
        if (processedCount % batchSize === 0) {
          const percentage = ((processedCount / stats.totalStudents) * 100).toFixed(1);
          console.log(`   Progress: ${processedCount}/${stats.totalStudents} (${percentage}%) - Downloaded: ${stats.imagesDownloaded}`);
        }
      } catch (error) {
        stats.errors++;
        console.error(`   ❌ Error processing student ${student.studentNumber}:`, error instanceof Error ? error.message : 'Unknown error');
      }
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Download Complete!\n');
    console.log('📊 Summary:');
    console.log(`   Total students processed:    ${stats.totalStudents.toLocaleString()}`);
    console.log(`   Students with images:        ${stats.studentsWithImages.toLocaleString()}`);
    console.log(`   Students without images:     ${stats.studentsWithoutImages.toLocaleString()}`);
    console.log(`   Images successfully saved:   ${stats.imagesDownloaded.toLocaleString()}`);
    console.log(`   Errors encountered:          ${stats.errors.toLocaleString()}`);
    console.log(`\n📁 Images saved to: ${outputDir}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
downloadStudentImages()
  .then(() => {
    console.log('\n✅ Script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
