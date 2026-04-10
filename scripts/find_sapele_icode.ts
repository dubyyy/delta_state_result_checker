import fs from 'fs';
import path from 'path';

interface SchoolEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

async function findSapeleICode() {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const schools: SchoolEntry[] = JSON.parse(fileContent);

    // Find all schools in Sapele
    const sapeleSchools = schools.filter(school => 
      school.schName.toUpperCase().includes('SAPELE')
    );

    console.log('🔍 Searching for Sapele schools...\n');

    if (sapeleSchools.length === 0) {
      console.log('❌ No schools found with "SAPELE" in the name');
      return;
    }

    // Get unique LGA codes and L codes for Sapele
    const lgaCodes = [...new Set(sapeleSchools.map(s => s.lgaCode))];
    const lCodes = [...new Set(sapeleSchools.map(s => s.lCode))];

    console.log(`📍 Found ${sapeleSchools.length} schools in Sapele:`);
    console.log('=====================================');

    sapeleSchools.forEach((school, index) => {
      console.log(`${index + 1}. ${school.schName}`);
      console.log(`   LGA Code: ${school.lgaCode}`);
      console.log(`   L Code (iCode): ${school.lCode}`);
      console.log(`   School Code: ${school.schCode}`);
      console.log('');
    });

    console.log('📋 Summary for Sapele:');
    console.log('========================');
    console.log(`LGA Codes: ${lgaCodes.join(', ')}`);
    console.log(`Available iCodes (L Codes): ${lCodes.join(', ')}`);
    console.log(`Number of schools: ${sapeleSchools.length}`);

    // Also check what LGA number this corresponds to in auth options
    console.log('\n🔐 Authentication Info:');
    console.log('=======================');
    console.log('For CIE authentication, you can use:');
    lgaCodes.forEach(lgaCode => {
      console.log(`  LGA Code: ${lgaCode}, iCode: ${lCodes[0]}`);
    });

  } catch (error) {
    console.error('❌ Error finding Sapele iCode:', error);
  }
}

findSapeleICode();
