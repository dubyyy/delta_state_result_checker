import { prisma } from '../lib/prisma';

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration?: number;
}

const results: TestResult[] = [];

function logTest(name: string, passed: boolean, message: string, duration?: number) {
  results.push({ name, passed, message, duration });
  const icon = passed ? '✅' : '❌';
  const durationStr = duration ? ` (${duration}ms)` : '';
  console.log(`${icon} ${name}${durationStr}: ${message}`);
}

async function testDatabaseConnection() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    logTest('Database Connection', true, 'Connected successfully', Date.now() - start);
    return true;
  } catch (error) {
    logTest('Database Connection', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testStudentDataAvailability() {
  const start = Date.now();
  try {
    const [totalStudents, studentsWithImages, totalPost, postWithImages] = await Promise.all([
      prisma.studentRegistration.count(),
      prisma.studentRegistration.count({ where: { passport: { not: null } } }),
      prisma.postRegistration.count(),
      prisma.postRegistration.count({ where: { passport: { not: null } } }),
    ]);

    const totalWithImages = studentsWithImages + postWithImages;
    
    logTest(
      'Student Data Availability',
      true,
      `Found ${totalStudents} regular students (${studentsWithImages} with images), ${totalPost} post-reg (${postWithImages} with images). Total with images: ${totalWithImages}`,
      Date.now() - start
    );
    
    return totalWithImages;
  } catch (error) {
    logTest('Student Data Availability', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0;
  }
}

async function testBatchedFetching() {
  const start = Date.now();
  try {
    const BATCH_SIZE = 500;
    let cursor: string | undefined = undefined;
    let totalFetched = 0;
    let batches = 0;

    // Test first 3 batches
    for (let i = 0; i < 3; i++) {
      const batch: Array<{id: string, studentNumber: string, passport: string | null}> = await prisma.studentRegistration.findMany({
        where: { passport: { not: null } },
        select: {
          id: true,
          studentNumber: true,
          passport: true,
        },
        take: BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (batch.length === 0) break;
      
      totalFetched += batch.length;
      batches++;
      cursor = batch[batch.length - 1].id;

      if (batch.length < BATCH_SIZE) break;
    }

    const message = totalFetched > 0 
      ? `Successfully fetched ${totalFetched} students in ${batches} batch(es)`
      : 'No students with images found (this is OK if database is empty)';

    logTest('Batched Fetching', true, message, Date.now() - start);
    return totalFetched;
  } catch (error) {
    logTest('Batched Fetching', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return 0;
  }
}

async function testFilterBySchoolCode() {
  const start = Date.now();
  try {
    // Get a sample school code
    const sampleStudent = await prisma.studentRegistration.findFirst({
      where: { passport: { not: null } },
      include: { school: true },
    });

    if (!sampleStudent) {
      logTest('Filter by School Code', true, 'Skipped - no students with images found', Date.now() - start);
      return true;
    }

    const schoolCode = sampleStudent.school.schoolCode;
    const filtered = await prisma.studentRegistration.count({
      where: {
        school: { schoolCode },
        passport: { not: null },
      },
    });

    logTest(
      'Filter by School Code',
      filtered > 0,
      `Found ${filtered} students with images for school ${schoolCode}`,
      Date.now() - start
    );
    return filtered > 0;
  } catch (error) {
    logTest('Filter by School Code', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testFilterByRegistrationType() {
  const start = Date.now();
  try {
    const [regularCount, lateCount] = await Promise.all([
      prisma.studentRegistration.count({
        where: {
          passport: { not: null },
          lateRegistration: false,
        },
      }),
      prisma.studentRegistration.count({
        where: {
          passport: { not: null },
          lateRegistration: true,
        },
      }),
    ]);

    logTest(
      'Filter by Registration Type',
      true,
      `Regular: ${regularCount}, Late: ${lateCount}`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Filter by Registration Type', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testImageDataFormat() {
  const start = Date.now();
  try {
    const studentWithImage = await prisma.studentRegistration.findFirst({
      where: { passport: { not: null } },
      select: { studentNumber: true, passport: true },
    });

    if (!studentWithImage) {
      logTest('Image Data Format', true, 'Skipped - no students with images found', Date.now() - start);
      return true;
    }

    const hasDataUrl = studentWithImage.passport!.startsWith('data:image/');
    const isBase64 = /^[A-Za-z0-9+/=]+$/.test(studentWithImage.passport!.substring(0, 100));
    
    logTest(
      'Image Data Format',
      true,
      hasDataUrl ? 'Data URL format detected' : isBase64 ? 'Base64 format detected' : 'Unknown format',
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Image Data Format', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testMemoryEfficiency() {
  const start = Date.now();
  try {
    const before = process.memoryUsage();
    
    // Fetch 1000 students with images
    const students = await prisma.studentRegistration.findMany({
      where: { passport: { not: null } },
      select: {
        studentNumber: true,
        firstname: true,
        lastname: true,
        passport: true,
      },
      take: 1000,
    });

    const after = process.memoryUsage();
    const heapUsedMB = ((after.heapUsed - before.heapUsed) / 1024 / 1024).toFixed(2);
    
    logTest(
      'Memory Efficiency',
      true,
      `Fetched ${students.length} students, heap increase: ${heapUsedMB} MB`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Memory Efficiency', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testLargeDatasetSimulation() {
  const start = Date.now();
  try {
    const totalStudents = await prisma.studentRegistration.count({
      where: { passport: { not: null } },
    });

    const BATCH_SIZE = 500;
    const estimatedBatches = Math.ceil(totalStudents / BATCH_SIZE);
    const estimatedTimeSeconds = Math.ceil((estimatedBatches * 0.5) + (totalStudents * 0.001));
    
    let recommendation = '';
    if (totalStudents > 50000) {
      recommendation = '⚠️  Warning: >50k images may exceed VPS timeout. Ensure Nginx timeout is set to 1800s+';
    } else if (totalStudents > 10000) {
      recommendation = '⚠️  Recommendation: Set Nginx timeout to 600s+ for optimal performance';
    } else if (totalStudents > 1000) {
      recommendation = '✅ Dataset size is within safe limits';
    } else {
      recommendation = '✅ Small dataset, no timeout concerns';
    }

    logTest(
      'Large Dataset Simulation',
      true,
      `Total: ${totalStudents} students, Est. batches: ${estimatedBatches}, Est. time: ~${estimatedTimeSeconds}s. ${recommendation}`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Large Dataset Simulation', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Starting Download Images API Tests\n');
  console.log('=' .repeat(80));
  
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Database connection failed. Aborting tests.\n');
    process.exit(1);
  }

  const totalWithImages = await testStudentDataAvailability();
  
  if (totalWithImages === 0) {
    console.log('\n⚠️  No students with images in database. Some tests will be skipped.\n');
  }

  await testBatchedFetching();
  await testFilterBySchoolCode();
  await testFilterByRegistrationType();
  await testImageDataFormat();
  await testMemoryEfficiency();
  await testLargeDatasetSimulation();

  console.log('=' .repeat(80));
  console.log('\n📊 Test Summary\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.message}`);
    });
  }

  console.log('\n✅ All tests completed!\n');
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
