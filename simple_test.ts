import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simpleTest() {
  try {
    console.log('Checking database connection...');
    await prisma.$connect();
    console.log('✓ Database connected');
    
    // Check if any schools exist
    const schoolCount = await prisma.school.count();
    console.log(`\nSchools in database: ${schoolCount}`);
    
    if (schoolCount === 0) {
      console.log('\n⚠️ No schools registered. Creating test school...');
      const testSchool = await prisma.school.create({
        data: {
          lgaCode: '1',
          schoolCode: '1',
          schoolName: 'ADAMS PRIMARY SCHOOL, ISSELE-UKU',
          password: 'test123',
          accessPin: 'delta'
        }
      });
      console.log('✓ Test school created:', testSchool.id);
    } else {
      const schools = await prisma.school.findMany({ take: 3 });
      console.log('\nSample schools:');
      schools.forEach(s => console.log(`  - ${s.schoolName} (LGA: ${s.lgaCode}, Code: ${s.schoolCode})`));
    }
    
    // Check existing registrations
    const regCount = await prisma.studentRegistration.count();
    console.log(`\nExisting student registrations: ${regCount}`);
    
    if (regCount > 0) {
      const regs = await prisma.studentRegistration.findMany({
        take: 5,
        orderBy: { studentNumber: 'asc' },
        select: { firstname: true, lastname: true, studentNumber: true }
      });
      console.log('\nSample registrations (alphabetical by number):');
      regs.forEach(r => console.log(`  ${r.studentNumber}: ${r.firstname} ${r.lastname}`));
    }
    
    console.log('\n✅ Database check complete. You can now test registration via the UI.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

simpleTest();
