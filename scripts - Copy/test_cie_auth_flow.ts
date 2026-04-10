import { PrismaClient } from '@prisma/client';
import { LGA_MAPPING } from '../lib/lga-mapping';
import { generateToken } from '../lib/jwt';

const prisma = new PrismaClient();

async function testCIEAuthFlow() {
  try {
    console.log('🔍 Testing CIE Authentication Flow\n');

    // Test with Ika South (has 7 students + 1 post registration)
    const testLgaCode = '1918656250'; // Ika South
    const testLCode = '1918656250'; // Using same as LGA code for testing

    console.log(`📍 Testing with LGA: ${LGA_MAPPING[testLgaCode]} (${testLgaCode})`);

    // Step 1: Check what schools exist in this LGA
    const schoolsInLga = await prisma.school.findMany({
      where: { lgaCode: testLgaCode },
      include: {
        _count: {
          select: {
            studentRegistrations: true,
            postRegistrations: true
          }
        }
      }
    });

    console.log(`\n🏫 Schools in ${LGA_MAPPING[testLgaCode]}:`);
    schoolsInLga.forEach(school => {
      console.log(`  ${school.schoolName} (${school.schoolCode}): ${school._count.studentRegistrations} students, ${school._count.postRegistrations} post registrations`);
    });

    // Step 2: Generate token like the auth API would
    if (schoolsInLga.length > 0) {
      const firstSchool = schoolsInLga[0];
      const token = generateToken({
        schoolId: firstSchool.id,
        lgaCode: firstSchool.lgaCode,
        schoolCode: firstSchool.schoolCode,
        schoolName: firstSchool.schoolName,
      });

      console.log(`\n🔐 Generated token for: ${firstSchool.schoolName}`);
      console.log(`   LGA Code in token: ${firstSchool.lgaCode}`);

      // Step 3: Test the API query that the frontend would make
      const studentsInLga = await prisma.studentRegistration.findMany({
        where: {
          school: {
            lgaCode: testLgaCode
          }
        },
        include: {
          school: {
            select: {
              schoolName: true,
              lgaCode: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`\n👥 Students found in ${LGA_MAPPING[testLgaCode]}:`);
      console.log(`   Total: ${studentsInLga.length}`);
      
      if (studentsInLga.length > 0) {
        studentsInLga.forEach((student, index) => {
          console.log(`   ${index + 1}. ${student.studentNumber}: ${student.lastname}, ${student.firstname} - ${student.school.schoolName}`);
        });
      } else {
        console.log('   ❌ No students found!');
      }

      // Step 4: Check post registrations too
      const postRegsInLga = await prisma.postRegistration.findMany({
        where: {
          school: {
            lgaCode: testLgaCode
          }
        },
        include: {
          school: {
            select: {
              schoolName: true,
              lgaCode: true
            }
          }
        }
      });

      console.log(`\n📝 Post registrations found in ${LGA_MAPPING[testLgaCode]}:`);
      console.log(`   Total: ${postRegsInLga.length}`);
      
      if (postRegsInLga.length > 0) {
        postRegsInLga.forEach((post, index) => {
          console.log(`   ${index + 1}. ${post.studentNumber}: ${post.lastname}, ${post.firstname} - ${post.school.schoolName}`);
        });
      }

    } else {
      console.log(`\n❌ No schools found in ${LGA_MAPPING[testLgaCode]}`);
    }

    // Step 5: Test with an LGA that has no data
    console.log(`\n\n🔍 Testing with LGA that has no data:`);
    const emptyLgaCode = '660742704'; // Aniocha South (should have 0 registrations)
    
    const emptyLgaStudents = await prisma.studentRegistration.count({
      where: {
        school: {
          lgaCode: emptyLgaCode
        }
      }
    });

    const emptyLgaPost = await prisma.postRegistration.count({
      where: {
        school: {
          lgaCode: emptyLgaCode
        }
      }
    });

    console.log(`${LGA_MAPPING[emptyLgaCode]} (${emptyLgaCode}):`);
    console.log(`  Students: ${emptyLgaStudents}`);
    console.log(`  Post registrations: ${emptyLgaPost}`);
    console.log(`  Total: ${emptyLgaStudents + emptyLgaPost}`);

  } catch (error) {
    console.error('❌ Error testing auth flow:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCIEAuthFlow();
