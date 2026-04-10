// Test script to verify API endpoints work correctly
import { generateToken } from '../lib/jwt';

async function testAPIEndpoints() {
  console.log('🔍 Testing CIE API Endpoints\n');

  // Test 1: Get auth options
  try {
    const authOptionsResponse = await fetch('http://localhost:3000/api/cie/auth-options');
    if (authOptionsResponse.ok) {
      const authData = await authOptionsResponse.json();
      console.log('✅ Auth Options API works');
      console.log(`   Available LGAs: ${authData.data?.length || 0}`);
      
      // Find Ika South in the options
      const ikaSouth = authData.data?.find((opt: any) => opt.lgaCode === '1918656250');
      if (ikaSouth) {
        console.log(`   ✅ Ika South found: ${ikaSouth.lgaName}`);
        console.log(`   Available iCodes: ${ikaSouth.lCodes.join(', ')}`);
      } else {
        console.log('   ❌ Ika South not found in auth options');
      }
    } else {
      console.log('❌ Auth Options API failed:', authOptionsResponse.status);
    }
  } catch (error) {
    console.log('❌ Cannot test Auth Options API - server might not be running');
  }

  // Test 2: Test authentication
  try {
    const authResponse = await fetch('http://localhost:3000/api/cie/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        lgaCode: '1918656250', // Ika South
        icode: '1918656250'   // Using LGA code as iCode for testing
      })
    });

    if (authResponse.ok) {
      const authResult = await authResponse.json();
      console.log('\n✅ Authentication successful');
      console.log(`   Token generated: ${authResult.token ? 'Yes' : 'No'}`);
      console.log(`   School: ${authResult.school?.schoolName}`);
      console.log(`   LGA Code: ${authResult.school?.lgaCode}`);

      // Test 3: Use the token to get students
      if (authResult.token) {
        const studentsResponse = await fetch('http://localhost:3000/api/cie/students?lgaCode=1918656250&page=1&limit=50', {
          headers: {
            'Authorization': `Bearer ${authResult.token}`
          }
        });

        if (studentsResponse.ok) {
          const studentsData = await studentsResponse.json();
          console.log('\n✅ Students API works');
          console.log(`   Students returned: ${studentsData.data?.length || 0}`);
          console.log(`   Total in meta: ${studentsData.meta?.total || 0}`);
          console.log(`   Pages: ${studentsData.meta?.totalPages || 0}`);
          
          if (studentsData.data && studentsData.data.length > 0) {
            console.log('\n📋 Sample students:');
            studentsData.data.slice(0, 3).forEach((student: any, index: number) => {
              console.log(`   ${index + 1}. ${student.studentNumber}: ${student.lastname}, ${student.firstname} - ${student.school?.schoolName}`);
            });
          }
        } else {
          console.log('\n❌ Students API failed:', studentsResponse.status);
          const errorText = await studentsResponse.text();
          console.log('   Error:', errorText);
        }
      }
    } else {
      const errorData = await authResponse.json();
      console.log('\n❌ Authentication failed:', authResponse.status);
      console.log('   Error:', errorData.error);
    }
  } catch (error) {
    console.log('\n❌ Cannot test authentication - server might not be running');
    console.log('   Make sure to run: npm run dev');
  }
}

// Only run if this is executed directly
if (require.main === module) {
  testAPIEndpoints();
}

export { testAPIEndpoints };
