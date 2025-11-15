import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface JwtPayload {
  schoolId: string;
  lgaCode: string;
  schoolCode: string;
  schoolName: string;
}

interface RegistrationData {
  studentNumber: string;
  lastname: string;
  othername: string;
  firstname: string;
  gender: string;
  schoolType: string;
  passport: string | null;
  english: { term1: string; term2: string; term3: string };
  arithmetic: { term1: string; term2: string; term3: string };
  general: { term1: string; term2: string; term3: string };
  religious: { term1: string; term2: string; term3: string; type: string };
}

export async function GET(req: NextRequest) {
  try {
    // Get and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JwtPayload;
    
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-this'
      ) as JwtPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    // Fetch all registrations for this school
    const registrations = await prisma.studentRegistration.findMany({
      where: {
        schoolId: decoded.schoolId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(
      { registrations },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch registrations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get and verify JWT token
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please login again.' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    let decoded: JwtPayload;
    
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-this'
      ) as JwtPayload;
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    // Get registrations from request body
    const { registrations } = await req.json();

    if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
      return NextResponse.json(
        { error: 'No registrations to save' },
        { status: 400 }
      );
    }

    // Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: decoded.schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Prepare data for bulk insert
    const studentData = registrations.map((reg: RegistrationData) => ({
      studentNumber: reg.studentNumber,
      firstname: reg.firstname,
      othername: reg.othername || '',
      lastname: reg.lastname,
      gender: reg.gender,
      schoolType: reg.schoolType,
      passport: reg.passport,
      englishTerm1: reg.english.term1 || '-',
      englishTerm2: reg.english.term2 || '-',
      englishTerm3: reg.english.term3 || '-',
      arithmeticTerm1: reg.arithmetic.term1 || '-',
      arithmeticTerm2: reg.arithmetic.term2 || '-',
      arithmeticTerm3: reg.arithmetic.term3 || '-',
      generalTerm1: reg.general.term1 || '-',
      generalTerm2: reg.general.term2 || '-',
      generalTerm3: reg.general.term3 || '-',
      religiousType: reg.religious.type || '',
      religiousTerm1: reg.religious.term1 || '-',
      religiousTerm2: reg.religious.term2 || '-',
      religiousTerm3: reg.religious.term3 || '-',
      schoolId: decoded.schoolId,
    }));

    // Check for duplicate student numbers
    const studentNumbers = studentData.map(s => s.studentNumber);
    const existingStudents = await prisma.studentRegistration.findMany({
      where: {
        studentNumber: {
          in: studentNumbers,
        },
      },
      select: {
        studentNumber: true,
      },
    });

    if (existingStudents.length > 0) {
      const duplicates = existingStudents.map(s => s.studentNumber).join(', ');
      return NextResponse.json(
        { error: `The following student numbers already exist: ${duplicates}` },
        { status: 400 }
      );
    }

    // Save all registrations
    const result = await prisma.studentRegistration.createMany({
      data: studentData,
    });

    return NextResponse.json(
      {
        message: 'Registrations saved successfully',
        count: result.count,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration save error:', error);
    return NextResponse.json(
      { error: 'Failed to save registrations. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
