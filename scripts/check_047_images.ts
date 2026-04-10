import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check047Images() {
  console.log('🔍 Checking students 0470001 to 0470011...\n');
  
  const examNumbers = [];
  for (let i = 1; i <= 11; i++) {
    examNumbers.push(`047${String(i).padStart(4, '0')}`);
  }
  
  try {
    for (const examNum of examNumbers) {
      const student = await prisma.studentRegistration.findFirst({
        where: { studentNumber: examNum },
        select: {
          studentNumber: true,
          firstname: true,
          lastname: true,
          othername: true,
          gender: true,
          school: {
            select: {
              schoolName: true,
              schoolCode: true,
              lgaCode: true,
            },
          },
          passport: true,
        },
      });
      
      const post = await prisma.postRegistration.findFirst({
        where: { studentNumber: examNum },
        select: {
          studentNumber: true,
          firstname: true,
          lastname: true,
          othername: true,
          gender: true,
          school: {
            select: {
              schoolName: true,
              schoolCode: true,
              lgaCode: true,
            },
          },
          passport: true,
        },
      });
      
      const record = student || post;
      if (record) {
        const hasImage = record.passport ? '✅ Has image' : '❌ No image';
        console.log(`${examNum}: ${record.lastname} ${record.firstname} ${record.othername || ''} (${record.gender}) - ${record.school.schoolName} - ${hasImage}`);
      } else {
        console.log(`${examNum}: ❌ NOT FOUND`);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

check047Images();
