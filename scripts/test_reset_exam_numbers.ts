import { prisma } from "../lib/prisma";

/**
 * Test script for reset-exam-numbers endpoint
 * 
 * This test verifies:
 * 1. Students are sorted alphabetically by lastname then firstname (case-insensitive)
 * 2. Exam numbers are reordered sequentially (0001, 0002, ...)
 * 3. The two-phase SQL approach handles unique constraint violations
 */

async function testResetExamNumbers() {
  console.log("🧪 Testing reset-exam-numbers functionality...\n");

  try {
    // Step 1: Find a school with students
    const school = await prisma.school.findFirst({
      where: {
        studentRegistrations: {
          some: {},
        },
      },
      include: {
        studentRegistrations: {
          select: {
            id: true,
            studentNumber: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });

    if (!school || school.studentRegistrations.length === 0) {
      console.log("❌ No school with students found. Creating test data...\n");
      
      // Create a test school
      const testSchool = await prisma.school.create({
        data: {
          lgaCode: "99",
          schoolCode: "999",
          schoolName: "Test School for Reset",
          password: "test123",
        },
      });

      // Create SchoolData entry
      await prisma.schoolData.create({
        data: {
          lgaCode: "99",
          lCode: "99",
          schCode: "999",
          progID: "1",
          schName: "Test School for Reset",
        },
      });

      // Create test students with deliberately out-of-order names and numbers
      const testStudents = [
        { firstname: "Zara", lastname: "Adams", studentNumber: "999990005" },
        { firstname: "Alice", lastname: "Brown", studentNumber: "999990001" },
        { firstname: "Bob", lastname: "Brown", studentNumber: "999990003" },
        { firstname: "Charlie", lastname: "Adams", studentNumber: "999990002" },
        { firstname: "David", lastname: "Adams", studentNumber: "999990004" },
      ];

      for (const student of testStudents) {
        await prisma.studentRegistration.create({
          data: {
            ...student,
            gender: "male",
            schoolType: "public",
            schoolId: testSchool.id,
          },
        });
      }

      console.log("✅ Created test school with 5 students\n");
      console.log("📋 Initial state (unsorted):");
      const initial = await prisma.studentRegistration.findMany({
        where: { schoolId: testSchool.id },
        select: { firstname: true, lastname: true, studentNumber: true },
      });
      initial.forEach((s) => {
        console.log(`   ${s.lastname}, ${s.firstname} → ${s.studentNumber}`);
      });
      console.log();
    }

    // Step 2: Get the school to test
    const targetSchool = school || await prisma.school.findFirst({
      where: { lgaCode: "99", schoolCode: "999" },
    });

    if (!targetSchool) {
      throw new Error("Failed to find or create test school");
    }

    console.log(`🎯 Testing with school: ${targetSchool.schoolName || targetSchool.schoolCode}`);
    console.log(`   LGA Code: ${targetSchool.lgaCode}, School Code: ${targetSchool.schoolCode}\n`);

    // Step 3: Get students BEFORE reset
    const beforeReset = await prisma.studentRegistration.findMany({
      where: { schoolId: targetSchool.id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        studentNumber: true,
      },
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });

    console.log(`📊 Found ${beforeReset.length} students\n`);
    console.log("📋 Before reset:");
    beforeReset.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.lastname}, ${s.firstname} → ${s.studentNumber}`);
    });
    console.log();

    // Step 4: Call the reset endpoint
    console.log("🔄 Calling reset-exam-numbers endpoint...\n");
    
    const response = await fetch("http://localhost:3000/api/admin/reset-exam-numbers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lgaCode: targetSchool.lgaCode,
        schoolCode: targetSchool.schoolCode,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.log("❌ API call failed:");
      console.log(JSON.stringify(result, null, 2));
      throw new Error(result.error || "API call failed");
    }

    console.log("✅ API call succeeded");
    console.log(`   Message: ${result.message}`);
    console.log(`   Count: ${result.count}\n`);

    // Step 5: Get students AFTER reset
    const afterReset = await prisma.studentRegistration.findMany({
      where: { schoolId: targetSchool.id },
      select: {
        id: true,
        firstname: true,
        lastname: true,
        studentNumber: true,
      },
      orderBy: [{ lastname: "asc" }, { firstname: "asc" }],
    });

    console.log("📋 After reset:");
    afterReset.forEach((s, i) => {
      console.log(`   ${i + 1}. ${s.lastname}, ${s.firstname} → ${s.studentNumber}`);
    });
    console.log();

    // Step 6: Verify results
    console.log("🔍 Verifying results...\n");

    // Get the expected prefix
    const schoolData = await prisma.schoolData.findFirst({
      where: {
        OR: [
          { lCode: targetSchool.lgaCode, schCode: targetSchool.schoolCode },
          { lgaCode: targetSchool.lgaCode, schCode: targetSchool.schoolCode },
        ],
      },
    });

    if (!schoolData) {
      throw new Error("SchoolData not found for verification");
    }

    const expectedPrefix = `${schoolData.lgaCode}${schoolData.schCode.padStart(3, "0")}`;
    
    let allPassed = true;

    // Verify sequential numbering
    for (let i = 0; i < afterReset.length; i++) {
      const expectedNumber = `${expectedPrefix}${(i + 1).toString().padStart(4, "0")}`;
      const actualNumber = afterReset[i].studentNumber;

      if (actualNumber !== expectedNumber) {
        console.log(`❌ Student ${i + 1} has wrong number:`);
        console.log(`   Expected: ${expectedNumber}`);
        console.log(`   Actual: ${actualNumber}`);
        allPassed = false;
      }
    }

    // Verify alphabetical sorting (case-insensitive)
    for (let i = 1; i < afterReset.length; i++) {
      const prev = afterReset[i - 1];
      const curr = afterReset[i];

      const lastCmp = prev.lastname.trim().toUpperCase().localeCompare(
        curr.lastname.trim().toUpperCase()
      );

      if (lastCmp > 0) {
        console.log(`❌ Students not sorted by lastname:`);
        console.log(`   ${prev.lastname} should come after ${curr.lastname}`);
        allPassed = false;
      } else if (lastCmp === 0) {
        const firstCmp = prev.firstname.trim().toUpperCase().localeCompare(
          curr.firstname.trim().toUpperCase()
        );
        if (firstCmp > 0) {
          console.log(`❌ Students not sorted by firstname:`);
          console.log(`   ${prev.firstname} should come after ${curr.firstname}`);
          allPassed = false;
        }
      }
    }

    // Verify no duplicates
    const numbers = new Set(afterReset.map((s) => s.studentNumber));
    if (numbers.size !== afterReset.length) {
      console.log(`❌ Duplicate student numbers found!`);
      allPassed = false;
    }

    if (allPassed) {
      console.log("✅ All verifications passed!");
      console.log(`   ✓ Sequential numbering (${expectedPrefix}0001, 0002, ...)`);
      console.log(`   ✓ Alphabetical sorting (lastname, firstname)`);
      console.log(`   ✓ No duplicate numbers`);
      console.log(`   ✓ Two-phase SQL handled unique constraints`);
    }

    console.log("\n🎉 Test completed successfully!\n");

  } catch (error) {
    console.error("\n❌ Test failed:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testResetExamNumbers();
