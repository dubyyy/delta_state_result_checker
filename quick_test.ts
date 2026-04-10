async function quickTest() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('Quick registration test...\n');
  
  // Login
  const loginRes = await fetch(`${baseUrl}/api/access/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ lgaCode: '1', schoolCode: '2', accessPin: 'delta' })
  });
  
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log('✓ Logged in\n');
  
  // Register
  const regRes = await fetch(`${baseUrl}/api/school/register-student`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      firstname: 'Test',
      lastname: 'Student',
      othername: '',
      gender: 'Male',
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
  
  const regData = await regRes.json();
  console.log('Response:', JSON.stringify(regData, null, 2));
  
  if (regData.saved) {
    console.log('\n✅ Registration working!');
    console.log(`Student Number: ${regData.saved.studentNumber}`);
    console.log(`Total students: ${regData.registrations.length}`);
    
    // Show first 3 students by number
    const sorted = regData.registrations
      .sort((a: any, b: any) => a.studentNumber.localeCompare(b.studentNumber))
      .slice(0, 3);
    
    console.log('\nFirst 3 students (alphabetically by number):');
    sorted.forEach((s: any) => console.log(`  ${s.studentNumber}: ${s.firstname} ${s.lastname}`));
  }
}

quickTest().catch(console.error);
