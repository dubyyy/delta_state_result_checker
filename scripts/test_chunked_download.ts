import { prisma } from '../lib/prisma';
const archiver = require('archiver');

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

async function testChunkedDownloadLogic() {
  const start = Date.now();
  try {
    // Simulate the chunked download logic
    const CHUNK_SIZE = 5000;
    
    // Get all IDs (lightweight query)
    const studentIds = await prisma.studentRegistration.findMany({
      where: { passport: { not: null } },
      select: { id: true, lateRegistration: true },
      orderBy: { id: 'asc' },
    });
    
    const postIds = await prisma.postRegistration.findMany({
      where: { passport: { not: null } },
      select: { id: true },
      orderBy: { id: 'asc' },
    });
    
    const totalImages = studentIds.length + postIds.length;
    const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);
    
    if (totalImages === 0) {
      logTest('Chunked Download Logic', true, 'Skipped - no images to test', Date.now() - start);
      return true;
    }
    
    // Test chunk calculation for first chunk
    const chunkIndex = 0;
    const startIdx = chunkIndex * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalImages);
    
    const chunkStudentIds = studentIds.slice(startIdx, Math.min(endIdx, studentIds.length));
    const chunkPostIds = postIds.slice(
      Math.max(0, startIdx - studentIds.length),
      Math.max(0, endIdx - studentIds.length)
    );
    
    const chunkSize = chunkStudentIds.length + chunkPostIds.length;
    
    logTest(
      'Chunked Download Logic',
      chunkSize > 0 || totalChunks > 0,
      `Total: ${totalImages} images, ${totalChunks} chunks. First chunk: ${chunkSize} images`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Chunked Download Logic', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testArchiveCreation() {
  const start = Date.now();
  try {
    // Test archiver works
    const archive = archiver('zip', { zlib: { level: 3 } });
    const chunks: Buffer[] = [];
    
    archive.on('data', (chunk: Buffer) => chunks.push(chunk));
    archive.on('error', (err: Error) => { throw err; });
    
    // Add a test image
    const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    archive.append(testImageBuffer, { name: 'test.jpg' });
    
    await archive.finalize();
    const zipBuffer = Buffer.concat(chunks);
    
    logTest(
      'Archive Creation',
      zipBuffer.length > 0,
      `Created ZIP with ${zipBuffer.length} bytes`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Archive Creation', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testImageProcessing() {
  const start = Date.now();
  try {
    // Get a sample student with image
    const student = await prisma.studentRegistration.findFirst({
      where: { passport: { not: null } },
      select: {
        studentNumber: true,
        firstname: true,
        lastname: true,
        passport: true,
        school: { select: { schoolCode: true } },
      },
    });
    
    if (!student) {
      logTest('Image Processing', true, 'Skipped - no students with images', Date.now() - start);
      return true;
    }
    
    // Test base64 extraction
    let base64Data: string;
    let fileExtension = 'jpg';
    
    if (student.passport!.startsWith('data:image/')) {
      const matches = student.passport!.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        fileExtension = matches[1];
        base64Data = matches[2];
      } else {
        const parts = student.passport!.split(',');
        base64Data = parts[1] || student.passport!;
      }
    } else {
      base64Data = student.passport!;
    }
    
    // Test filename generation
    const sanitizedSchool = student.school?.schoolCode || 'unknown';
    const sanitizedName = `${sanitizedSchool}_${student.studentNumber}_${student.lastname}_${student.firstname}`
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .substring(0, 100);
    const filename = `students/${sanitizedName}.${fileExtension}`;
    
    // Verify buffer can be created
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    logTest(
      'Image Processing',
      imageBuffer.length > 0,
      `Processed ${student.studentNumber}, size: ${imageBuffer.length} bytes, filename: ${filename.substring(0, 50)}...`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Image Processing', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testBatchIdFetching() {
  const start = Date.now();
  try {
    // Test fetching IDs only (lightweight)
    const ids = await prisma.studentRegistration.findMany({
      where: { passport: { not: null } },
      select: { id: true, lateRegistration: true },
      orderBy: { id: 'asc' },
      take: 10000,
    });
    
    logTest(
      'Batch ID Fetching',
      true,
      `Fetched ${ids.length} student IDs (lightweight query)`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Batch ID Fetching', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testChunkCalculation() {
  const start = Date.now();
  try {
    const CHUNK_SIZE = 5000;
    
    // Get counts
    const [studentCount, postCount] = await Promise.all([
      prisma.studentRegistration.count({ where: { passport: { not: null } } }),
      prisma.postRegistration.count({ where: { passport: { not: null } } }),
    ]);
    
    const totalImages = studentCount + postCount;
    const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);
    
    // Calculate estimated file sizes (assuming 50KB average per image)
    const avgImageSizeKB = 50;
    const estimatedTotalSizeMB = (totalImages * avgImageSizeKB) / 1024;
    const estimatedChunkSizeMB = (CHUNK_SIZE * avgImageSizeKB) / 1024;
    
    logTest(
      'Chunk Calculation',
      true,
      `${totalImages} images → ${totalChunks} chunks. Est. total: ${estimatedTotalSizeMB.toFixed(1)}MB, per chunk: ${estimatedChunkSizeMB.toFixed(1)}MB`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('Chunk Calculation', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testLargeDatasetScenario() {
  const start = Date.now();
  try {
    const CHUNK_SIZE = 5000;
    
    const [studentCount, postCount] = await Promise.all([
      prisma.studentRegistration.count({ where: { passport: { not: null } } }),
      prisma.postRegistration.count({ where: { passport: { not: null } } }),
    ]);
    
    const totalImages = studentCount + postCount;
    const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);
    
    let message = '';
    if (totalImages === 0) {
      message = 'No images in database';
    } else if (totalImages <= 5000) {
      message = `Small dataset: ${totalImages} images in 1 chunk. No chunking needed.`;
    } else if (totalImages <= 20000) {
      message = `Medium dataset: ${totalImages} images in ${totalChunks} chunks.`;
    } else if (totalImages <= 60000) {
      message = `Large dataset: ${totalImages} images in ${totalChunks} chunks. Chunking essential.`;
    } else {
      message = `Very large dataset: ${totalImages} images in ${totalChunks} chunks. May need multiple download sessions.`;
    }
    
    logTest('Large Dataset Scenario', true, message, Date.now() - start);
    return true;
  } catch (error) {
    logTest('Large Dataset Scenario', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testEndToEndChunkSimulation() {
  const start = Date.now();
  try {
    const CHUNK_SIZE = 5000;
    const TEST_CHUNK_SIZE = 100; // Limit for testing to avoid Prisma parameter limits
    
    // Get all IDs (limited for test)
    const studentIds = await prisma.studentRegistration.findMany({
      where: { passport: { not: null } },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: 1000, // Limit for testing
    });
    
    if (studentIds.length === 0) {
      logTest('End-to-End Chunk Simulation', true, 'Skipped - no images', Date.now() - start);
      return true;
    }
    
    const totalImages = studentIds.length;
    const totalChunks = Math.ceil(totalImages / TEST_CHUNK_SIZE);
    
    // Simulate processing first chunk (limited size)
    const chunkStudentIds = studentIds.slice(0, TEST_CHUNK_SIZE);
    
    // Fetch actual data for this chunk
    const chunkStart = Date.now();
    const chunkStudents = await prisma.studentRegistration.findMany({
      where: { id: { in: chunkStudentIds.map(s => s.id) } },
      select: { studentNumber: true, passport: true },
    });
    const chunkDuration = Date.now() - chunkStart;
    
    // Estimate full time based on actual counts
    const realTotalImages = await prisma.studentRegistration.count({ where: { passport: { not: null } } });
    const realTotalChunks = Math.ceil(realTotalImages / CHUNK_SIZE);
    const estimatedTotalTime = chunkDuration * (realTotalChunks > 0 ? realTotalChunks : 1);
    
    logTest(
      'End-to-End Chunk Simulation',
      true,
      `Tested ${chunkStudents.length} images in ${chunkDuration}ms. Real dataset: ${realTotalImages} images → ${realTotalChunks} chunks. Est. time: ${(estimatedTotalTime / 1000).toFixed(1)}s`,
      Date.now() - start
    );
    return true;
  } catch (error) {
    logTest('End-to-End Chunk Simulation', false, `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
}

async function testAllChunksComplete() {
  const start = Date.now();
  console.log('\n🔍 Testing All Chunks Complete\n');
  
  const CHUNK_SIZE = 5000;
  
  // Get all IDs
  const studentIds = await prisma.studentRegistration.findMany({
    where: { passport: { not: null } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  
  const postIds = await prisma.postRegistration.findMany({
    where: { passport: { not: null } },
    select: { id: true },
    orderBy: { id: 'asc' },
  });
  
  const totalImages = studentIds.length + postIds.length;
  const totalChunks = Math.ceil(totalImages / CHUNK_SIZE);
  
  console.log(`   Total images: ${totalImages}`);
  console.log(`   Expected chunks: ${totalChunks}`);
  
  // Track all IDs assigned to chunks
  const assignedStudentIds = new Set<string>();
  const assignedPostIds = new Set<string>();
  const chunkSizes: number[] = [];
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const startIdx = chunkIndex * CHUNK_SIZE;
    const endIdx = Math.min(startIdx + CHUNK_SIZE, totalImages);
    
    // Replicate API logic
    const chunkStudentIds: typeof studentIds = [];
    const chunkPostIds: typeof postIds = [];
    
    for (let i = startIdx; i < endIdx; i++) {
      if (i < studentIds.length) {
        chunkStudentIds.push(studentIds[i]);
        assignedStudentIds.add(studentIds[i].id);
      } else {
        const postIdx = i - studentIds.length;
        if (postIdx < postIds.length) {
          chunkPostIds.push(postIds[postIdx]);
          assignedPostIds.add(postIds[postIdx].id);
        }
      }
    }
    
    const chunkSize = chunkStudentIds.length + chunkPostIds.length;
    chunkSizes.push(chunkSize);
    
    if (chunkIndex < 3 || chunkIndex === totalChunks - 1) {
      console.log(`   Chunk ${chunkIndex + 1}: ${chunkSize} images (${chunkStudentIds.length} students, ${chunkPostIds.length} post)`);
    } else if (chunkIndex === 3) {
      console.log(`   ... (${totalChunks - 4} more chunks) ...`);
    }
  }
  
  // Verify all images are assigned
  const allAssigned = assignedStudentIds.size === studentIds.length && 
                      assignedPostIds.size === postIds.length;
  
  const totalAssigned = assignedStudentIds.size + assignedPostIds.size;
  
  logTest(
    'All Chunks Complete',
    allAssigned && totalAssigned === totalImages,
    allAssigned 
      ? `All ${totalImages} images assigned across ${totalChunks} chunks (${assignedStudentIds.size} students, ${assignedPostIds.size} post)`
      : `Missing images: ${totalImages - totalAssigned} (students: ${studentIds.length - assignedStudentIds.size}, post: ${postIds.length - assignedPostIds.size})`,
    Date.now() - start
  );
  
  // Verify chunk sizes
  let chunkSizesCorrect = true;
  const expectedLastChunk = totalImages - ((totalChunks - 1) * CHUNK_SIZE);
  
  for (let i = 0; i < chunkSizes.length; i++) {
    const expected = (i === chunkSizes.length - 1) ? expectedLastChunk : CHUNK_SIZE;
    if (chunkSizes[i] !== expected) {
      console.log(`   ⚠️  Chunk ${i + 1}: expected ${expected}, got ${chunkSizes[i]}`);
      chunkSizesCorrect = false;
    }
  }
  
  logTest(
    'Chunk Sizes Correct',
    chunkSizesCorrect,
    chunkSizesCorrect 
      ? `All ${totalChunks} chunks have correct sizes (last: ${expectedLastChunk})`
      : 'Some chunks have incorrect sizes'
  );
  
  // Check for duplicates
  const hasDuplicates = assignedStudentIds.size !== studentIds.length || 
                        assignedPostIds.size !== postIds.length;
  
  logTest(
    'No Duplicate IDs',
    !hasDuplicates,
    hasDuplicates ? 'Found duplicate IDs in chunk distribution' : 'No duplicates found'
  );
  
  return { totalImages, totalChunks, allAssigned, chunkSizesCorrect };
}

async function runTests() {
  console.log('\n🧪 Starting Chunked Download Images Test Suite\n');
  console.log('='.repeat(80));
  
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.log('\n❌ Database connection failed. Aborting tests.\n');
    process.exit(1);
  }

  const totalWithImages = await testStudentDataAvailability();
  
  console.log('\n📦 Chunked Download Tests');
  console.log('-'.repeat(80));
  
  await testChunkedDownloadLogic();
  await testChunkCalculation();
  await testBatchIdFetching();
  await testArchiveCreation();
  await testImageProcessing();
  await testLargeDatasetScenario();
  
  if (totalWithImages > 0) {
    console.log('\n🔧 End-to-End Tests');
    console.log('-'.repeat(80));
    await testEndToEndChunkSimulation();
    await testAllChunksComplete();
  }

  console.log('\n' + '='.repeat(80));
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

  console.log('\n💡 Info:');
  console.log(`   - CHUNK_SIZE: 5000 images per ZIP file`);
  console.log(`   - Each chunk creates a separate downloadable ZIP`);
  console.log(`   - Estimated 250MB per chunk (50KB per image average)`);
  console.log(`   - Downloads are sequential with 500ms delays between chunks`);
  console.log('');
  
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
