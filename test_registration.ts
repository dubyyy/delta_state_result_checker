/**
 * Test script for student registration endpoint
 * Tests the register-student API after the s.lCode fix
 */

async function testRegistration() {
  const baseUrl = 'http://localhost:3000';
  
  // Step 1: Login via /api/school/login to get auth token
  console.log('Step 1: Logging in via /api/school/login...');
  
  // Use the first school in data.json: lCode=1420256700, schCode=1
  const loginRes = await fetch(`${baseUrl}/api/school/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lgaCode: '1420256700',
      schoolCode: '1',
      password: 'test123456'
    })
  });
  
  if (!loginRes.ok) {
    const errText = await loginRes.text();
    console.error('Login failed (status', loginRes.status + '):', errText);
    if (loginRes.status === 404) {
      console.log('\nSchool not registered yet. Attempting signup first...');
      const signupRes = await fetch(`${baseUrl}/api/school/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lgaCode: '1420256700',
          schoolCode: '1',
          password: 'test123456'
        })
      });
      if (!signupRes.ok) {
        console.error('Signup also failed:', await signupRes.text());
        return;
      }
      console.log('Signup successful. Re-running test...');
      return testRegistration();
    }
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('Login successful. School:', loginData.school?.schoolName);
  
  // Step 2: Register first student (should get number ending in 0001)
  console.log('\nStep 2: Registering first student (Alice Anderson)...');
  const student1Res = await fetch(`${baseUrl}/api/school/register-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstname: 'Alice',
      lastname: 'Anderson',
      othername: '',
      gender: 'Female',
      schoolType: 'Primary',
      passport: null,
      english: { year1: 'A', year2: 'A', year3: 'A' },
      arithmetic: { year1: 'A', year2: 'A', year3: 'A' },
      general: { year1: 'A', year2: 'A', year3: 'A' },
      religious: { type: 'CRS', year1: 'A', year2: 'A', year3: 'A' },
      isLateRegistration: false,
      skipDuplicateCheck: false
    })
  });
  
  if (!student1Res.ok) {
    console.error('Registration 1 failed:', await student1Res.text());
    return;
  }
  
  const student1Data = await student1Res.json();
  console.log('✓ Student 1 registered:', student1Data.saved.studentNumber);
  
  // Step 3: Register second student (should get number ending in 0001, Alice moves to 0002)
  console.log('\nStep 3: Registering second student (Aaron Adams - alphabetically before Alice)...');
  const student2Res = await fetch(`${baseUrl}/api/school/register-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstname: 'Aaron',
      lastname: 'Adams',
      othername: '',
      gender: 'Male',
      schoolType: 'Primary',
      passport: null,
      english: { year1: 'B', year2: 'B', year3: 'B' },
      arithmetic: { year1: 'B', year2: 'B', year3: 'B' },
      general: { year1: 'B', year2: 'B', year3: 'B' },
      religious: { type: 'CRS', year1: 'B', year2: 'B', year3: 'B' },
      isLateRegistration: false,
      skipDuplicateCheck: false
    })
  });
  
  if (!student2Res.ok) {
    console.error('Registration 2 failed:', await student2Res.text());
    return;
  }
  
  const student2Data = await student2Res.json();
  console.log('✓ Student 2 registered:', student2Data.saved.studentNumber);
  
  // Step 4: Verify alphabetical ordering
  console.log('\nStep 4: Verifying alphabetical ordering...');
  const registrations = student2Data.registrations;
  
  const aaron = registrations.find((r: any) => r.firstname === 'Aaron');
  const alice = registrations.find((r: any) => r.firstname === 'Alice');
  
  if (!aaron || !alice) {
    console.error('✗ Could not find both students in response');
    return;
  }
  
  console.log(`Aaron Adams: ${aaron.studentNumber}`);
  console.log(`Alice Anderson: ${alice.studentNumber}`);
  
  const aaronNum = parseInt(aaron.studentNumber.slice(-4));
  const aliceNum = parseInt(alice.studentNumber.slice(-4));
  
  if (aaronNum < aliceNum) {
    console.log('✓ Alphabetical ordering is CORRECT (Aaron < Alice)');
  } else {
    console.error('✗ Alphabetical ordering is WRONG');
    return;
  }
  
  // Step 5: Test concurrent registrations
  console.log('\nStep 5: Testing concurrent registrations...');
  const concurrentPromises = [
    fetch(`${baseUrl}/api/school/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstname: 'Bob',
        lastname: 'Brown',
        othername: '',
        gender: 'Male',
        schoolType: 'Primary',
        passport: null,
        english: { year1: 'C', year2: 'C', year3: 'C' },
        arithmetic: { year1: 'C', year2: 'C', year3: 'C' },
        general: { year1: 'C', year2: 'C', year3: 'C' },
        religious: { type: 'CRS', year1: 'C', year2: 'C', year3: 'C' },
        isLateRegistration: false,
        skipDuplicateCheck: false
      })
    }),
    fetch(`${baseUrl}/api/school/register-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        firstname: 'Charlie',
        lastname: 'Clark',
        othername: '',
        gender: 'Male',
        schoolType: 'Primary',
        passport: null,
        english: { year1: 'D', year2: 'D', year3: 'D' },
        arithmetic: { year1: 'D', year2: 'D', year3: 'D' },
        general: { year1: 'D', year2: 'D', year3: 'D' },
        religious: { type: 'CRS', year1: 'D', year2: 'D', year3: 'D' },
        isLateRegistration: false,
        skipDuplicateCheck: false
      })
    })
  ];
  
  const results = await Promise.allSettled(concurrentPromises);
  
  let successCount = 0;
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.ok) {
      successCount++;
    } else {
      console.error('Concurrent registration failed:', result);
    }
  }
  
  console.log(`✓ ${successCount}/2 concurrent registrations succeeded`);
  
  if (successCount === 2) {
    console.log('\n✅ ALL TESTS PASSED - Registration is working correctly!');
  } else {
    console.log('\n⚠️ Some tests failed - check errors above');
  }
}

testRegistration().catch(console.error);
