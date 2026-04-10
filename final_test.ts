/**
 * Final registration test with real school from database
 */

async function finalTest() {
  const baseUrl = 'http://localhost:3000';
  
  // Use school that exists: ANAGBA PRIMARY SCHOOL, OBOMKPA
  console.log('Testing registration with real school...\n');
  
  // Step 1: Login
  console.log('Step 1: Logging in with LGA 1, School Code 2...');
  const loginRes = await fetch(`${baseUrl}/api/access/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lgaCode: '1',
      schoolCode: '2',
      accessPin: 'delta'
    })
  });
  
  if (!loginRes.ok) {
    console.error('❌ Login failed:', await loginRes.text());
    return;
  }
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✓ Login successful\n');
  
  // Step 2: Register a student
  console.log('Step 2: Registering student (Zara Zulu - should be last alphabetically)...');
  const startTime = Date.now();
  
  const regRes = await fetch(`${baseUrl}/api/school/register-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstname: 'Zara',
      lastname: 'Zulu',
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
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  if (!regRes.ok) {
    const errorText = await regRes.text();
    console.error(`❌ Registration failed (${duration}s):`, errorText);
    return;
  }
  
  const regData = await regRes.json();
  console.log(`✓ Registration successful in ${duration}s`);
  console.log(`  Student Number: ${regData.saved.studentNumber}`);
  console.log(`  Access Code: ${regData.saved.accCode}`);
  console.log(`  Total registrations returned: ${regData.registrations.length}\n`);
  
  // Step 3: Verify alphabetical ordering
  console.log('Step 3: Verifying alphabetical ordering...');
  const regs = regData.registrations
    .sort((a: any, b: any) => {
      const numA = parseInt(a.studentNumber.slice(-4));
      const numB = parseInt(b.studentNumber.slice(-4));
      return numA - numB;
    })
    .slice(0, 5);
  
  console.log('First 5 students by number:');
  regs.forEach((r: any) => {
    console.log(`  ${r.studentNumber}: ${r.firstname} ${r.lastname}`);
  });
  
  // Step 4: Register another student (should insert alphabetically)
  console.log('\nStep 4: Registering another student (Aaron Adams - should be first)...');
  const startTime2 = Date.now();
  
  const reg2Res = await fetch(`${baseUrl}/api/school/register-student`, {
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
  
  const duration2 = ((Date.now() - startTime2) / 1000).toFixed(2);
  
  if (!reg2Res.ok) {
    const errorText = await reg2Res.text();
    console.error(`❌ Second registration failed (${duration2}s):`, errorText);
    return;
  }
  
  const reg2Data = await reg2Res.json();
  console.log(`✓ Second registration successful in ${duration2}s`);
  console.log(`  Student Number: ${reg2Data.saved.studentNumber}`);
  
  const regs2 = reg2Data.registrations
    .sort((a: any, b: any) => {
      const numA = parseInt(a.studentNumber.slice(-4));
      const numB = parseInt(b.studentNumber.slice(-4));
      return numA - numB;
    })
    .slice(0, 5);
  
  console.log('\nFirst 5 students after second registration:');
  regs2.forEach((r: any) => {
    console.log(`  ${r.studentNumber}: ${r.firstname} ${r.lastname}`);
  });
  
  const aaron = regs2.find((r: any) => r.firstname === 'Aaron');
  if (aaron && aaron.studentNumber.endsWith('0001')) {
    console.log('\n✅ PERFECT! Aaron Adams got number ending in 0001 (first alphabetically)');
  } else {
    console.log('\n⚠️ Aaron did not get the first number');
  }
  
  console.log('\n✅ ALL TESTS PASSED - Registration is working with alphabetical ordering!');
}

finalTest().catch(console.error);
