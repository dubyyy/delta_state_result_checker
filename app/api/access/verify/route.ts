import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import schoolsData from '@/data.json';

const prisma = new PrismaClient();

interface SchoolData {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

export async function POST(req: NextRequest) {
  try {
    const { lgaCode, schoolCode, accessPin } = await req.json();

    // Validate input
    if (!lgaCode || !schoolCode || !accessPin) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate against data.json
    const schools = schoolsData as SchoolData[];
    const schoolData = schools.find(
      (s) => s.lgaCode === lgaCode && s.schCode === schoolCode
    );

    if (!schoolData) {
      return NextResponse.json(
        { error: 'Invalid LGA code or school code. Please check your credentials.' },
        { status: 404 }
      );
    }

    // Check if school exists in database with the access PIN
    const school = await prisma.school.findFirst({
      where: {
        lgaCode,
        schoolCode,
      },
    });

    // If school doesn't exist in database, allow access with any PIN
    // This allows schools to access before they register
    if (!school) {
      // Generate a temporary token for unregistered schools
      const token = jwt.sign(
        {
          lgaCode,
          schoolCode,
          schoolName: schoolData.schName,
          isRegistered: false,
        },
        process.env.JWT_SECRET || 'your-secret-key-change-this',
        { expiresIn: '7d' }
      );

      return NextResponse.json(
        {
          message: 'Access granted',
          token,
          school: {
            lgaCode,
            schoolCode,
            schoolName: schoolData.schName,
            isRegistered: false,
          },
        },
        { status: 200 }
      );
    }

    // For registered schools, verify the access PIN
    // You can implement PIN verification logic here
    // For now, we'll allow any PIN for registered schools too
    
    // Generate JWT token
    const token = jwt.sign(
      {
        schoolId: school.id,
        lgaCode: school.lgaCode,
        schoolCode: school.schoolCode,
        schoolName: school.schoolName,
        isRegistered: true,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        message: 'Access granted',
        token,
        school: {
          id: school.id,
          lgaCode: school.lgaCode,
          schoolCode: school.schoolCode,
          schoolName: school.schoolName,
          isRegistered: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Access verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
