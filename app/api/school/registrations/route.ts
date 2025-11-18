import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { generateUniqueAccCode } from '@/lib/generate-acccode';

const prisma = new PrismaClient();

interface JwtPayload {
  schoolId: string;
  lgaCode: string;
  schoolCode: string;
  schoolName: string;
}

export async function PATCH(req: NextRequest) {
  try {
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

    const body = await req.json();
    const { id, update } = body || {};
    if (!id || !update || typeof update !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request. Provide id and update payload.' },
        { status: 400 }
      );
    }

    // Map nested client fields to flat DB columns if provided
    const data: any = {};
    if (typeof update.firstname === 'string') data.firstname = update.firstname;
    if (typeof update.othername === 'string') data.othername = update.othername;
    if (typeof update.lastname === 'string') data.lastname = update.lastname;
    if (typeof update.gender === 'string') data.gender = update.gender;
    if (typeof update.schoolType === 'string') data.schoolType = update.schoolType;
    if (typeof update.passport === 'string' || update.passport === null) data.passport = update.passport;
    if (update.english) {
      if (typeof update.english.term1 === 'string') data.englishTerm1 = update.english.term1;
      if (typeof update.english.term2 === 'string') data.englishTerm2 = update.english.term2;
      if (typeof update.english.term3 === 'string') data.englishTerm3 = update.english.term3;
    }
    if (update.arithmetic) {
      if (typeof update.arithmetic.term1 === 'string') data.arithmeticTerm1 = update.arithmetic.term1;
      if (typeof update.arithmetic.term2 === 'string') data.arithmeticTerm2 = update.arithmetic.term2;
      if (typeof update.arithmetic.term3 === 'string') data.arithmeticTerm3 = update.arithmetic.term3;
    }
    if (update.general) {
      if (typeof update.general.term1 === 'string') data.generalTerm1 = update.general.term1;
      if (typeof update.general.term2 === 'string') data.generalTerm2 = update.general.term2;
      if (typeof update.general.term3 === 'string') data.generalTerm3 = update.general.term3;
    }
    if (update.religious) {
      if (typeof update.religious.type === 'string') data.religiousType = update.religious.type;
      if (typeof update.religious.term1 === 'string') data.religiousTerm1 = update.religious.term1;
      if (typeof update.religious.term2 === 'string') data.religiousTerm2 = update.religious.term2;
      if (typeof update.religious.term3 === 'string') data.religiousTerm3 = update.religious.term3;
    }

    const result = await prisma.studentRegistration.updateMany({
      where: { id, schoolId: decoded.schoolId },
      data,
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Registration not found or not owned by this school.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registration updated.' }, { status: 200 });
  } catch (error) {
    console.error('Registration patch error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest) {
  try {
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

    const body = await req.json().catch(() => ({}));
    const { id } = body || {};
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid request. Provide id to delete.' },
        { status: 400 }
      );
    }

    const result = await prisma.studentRegistration.deleteMany({
      where: { id, schoolId: decoded.schoolId },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Registration not found or not owned by this school.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Registration deleted.' }, { status: 200 });
  } catch (error) {
    console.error('Registration delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete registration. Please try again.' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
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

    // Get registrations and optional override flag from request body
    const { registrations, override } = await req.json();

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

    // Prepare data for bulk insert with unique accCodes
    const studentData = await Promise.all(
      registrations.map(async (reg: RegistrationData) => ({
        accCode: await generateUniqueAccCode(prisma),
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
      }))
    );

    // If override is true, replace all existing registrations for this school
    if (override === true) {
      const result = await prisma.$transaction(async (tx) => {
        await tx.studentRegistration.deleteMany({ where: { schoolId: decoded.schoolId } });
        const created = await tx.studentRegistration.createMany({ data: studentData });
        return created;
      });
      return NextResponse.json(
        {
          message: 'Registrations replaced successfully',
          count: result.count,
        },
        { status: 201 }
      );
    }

    // Otherwise, enforce duplicate check and append
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

    const result = await prisma.studentRegistration.createMany({ data: studentData });

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
