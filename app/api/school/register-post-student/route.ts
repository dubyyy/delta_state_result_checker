import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { generateBatchAccCodes } from '@/lib/generate-acccode';
import schoolsData from '@/data.json';

interface JwtPayload {
  schoolId: string;
  lgaCode: string;
  schoolCode: string;
  schoolName: string;
}

interface SchoolData {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

interface IncomingRegistration {
  firstname: string;
  lastname: string;
  othername: string;
  dateOfBirth?: string;
  gender: string;
  schoolType: string;
  passport: string | null;
  english: { year1?: string; year2?: string; year3?: string };
  arithmetic: { year1?: string; year2?: string; year3?: string };
  general: { year1?: string; year2?: string; year3?: string };
  religious: { year1?: string; year2?: string; year3?: string; type: string };
  isLateRegistration?: boolean;
  year?: string;
  prcd?: number;
  skipDuplicateCheck?: boolean;
}

/**
 * Unified register-post-student endpoint.
 * Combines: duplicate check + student number generation + accCode generation + save
 * into ONE round-trip instead of 4.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Auth
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
    } catch {
      return NextResponse.json(
        { error: 'Invalid or expired token. Please login again.' },
        { status: 401 }
      );
    }

    const reg: IncomingRegistration = await req.json();
    const skipDuplicateCheck = reg.skipDuplicateCheck === true;

    // 2. Verify school exists
    const school = await prisma.school.findUnique({
      where: { id: decoded.schoolId },
    });
    if (!school) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }

    // 3. Duplicate check (parallel queries across both tables) — skipped if user confirmed
    if (!skipDuplicateCheck) {
      const othernameFilter = reg.othername?.trim()
        ? { equals: reg.othername, mode: 'insensitive' as const }
        : { equals: '', mode: 'insensitive' as const };

      const [existingStudent, existingPost] = await Promise.all([
        prisma.studentRegistration.findFirst({
          where: {
            schoolId: decoded.schoolId,
            firstname: { equals: reg.firstname, mode: 'insensitive' },
            lastname: { equals: reg.lastname, mode: 'insensitive' },
            othername: othernameFilter,
          },
          select: { firstname: true, lastname: true, othername: true, studentNumber: true },
        }),
        prisma.postRegistration.findFirst({
          where: {
            schoolId: decoded.schoolId,
            firstname: { equals: reg.firstname, mode: 'insensitive' },
            lastname: { equals: reg.lastname, mode: 'insensitive' },
            othername: othernameFilter,
          },
          select: { firstname: true, lastname: true, othername: true, studentNumber: true },
        }),
      ]);

      const duplicate = existingStudent || existingPost;
      if (duplicate) {
        return NextResponse.json({
          isDuplicate: true,
          duplicate: {
            firstname: duplicate.firstname,
            lastname: duplicate.lastname,
            othername: duplicate.othername || '',
            studentNumber: duplicate.studentNumber,
          },
        }, { status: 200 });
      }
    }

    // 4. Generate student number (post-registration always uses incremental)
    const schools = schoolsData as SchoolData[];
    const schoolInfo = schools.find(
      (s) => s.lCode === decoded.lgaCode && s.schCode === decoded.schoolCode
    );
    if (!schoolInfo) {
      return NextResponse.json({ error: 'School data not found in registry' }, { status: 404 });
    }

    const x = schoolInfo.lgaCode;
    const fff = schoolInfo.schCode.padStart(3, '0');

    // Get max student number across both tables in parallel
    const [studentRegs, postRegs] = await Promise.all([
      prisma.studentRegistration.findMany({
        where: { schoolId: decoded.schoolId },
        select: { studentNumber: true },
      }),
      prisma.postRegistration.findMany({
        where: { schoolId: decoded.schoolId },
        select: { studentNumber: true },
      }),
    ]);

    let maxSequence = 0;
    [...studentRegs, ...postRegs].forEach((r) => {
      if (r.studentNumber) {
        const num = parseInt(r.studentNumber.slice(-4), 10);
        if (!isNaN(num) && num > maxSequence) maxSequence = num;
      }
    });

    const studentNumber = `${x}${fff}${(maxSequence + 1).toString().padStart(4, '0')}`;

    // 5. Generate accCode
    const accCodes = await generateBatchAccCodes(prisma, 1);

    // 6. Save the new post-registration
    const saved = await prisma.postRegistration.create({
      data: {
        accCode: accCodes[0],
        studentNumber,
        firstname: reg.firstname,
        othername: reg.othername || '',
        lastname: reg.lastname,
        dateOfBirth: reg.dateOfBirth && !isNaN(new Date(reg.dateOfBirth + 'T00:00:00Z').getTime()) ? new Date(reg.dateOfBirth + 'T00:00:00Z') : null,
        gender: reg.gender,
        schoolType: reg.schoolType,
        passport: reg.passport,
        englishTerm1: reg.english?.year1 || '-',
        englishTerm2: reg.english?.year2 || '-',
        englishTerm3: reg.english?.year3 || '-',
        arithmeticTerm1: reg.arithmetic?.year1 || '-',
        arithmeticTerm2: reg.arithmetic?.year2 || '-',
        arithmeticTerm3: reg.arithmetic?.year3 || '-',
        generalTerm1: reg.general?.year1 || '-',
        generalTerm2: reg.general?.year2 || '-',
        generalTerm3: reg.general?.year3 || '-',
        religiousType: reg.religious?.type || '',
        religiousTerm1: reg.religious?.year1 || '-',
        religiousTerm2: reg.religious?.year2 || '-',
        religiousTerm3: reg.religious?.year3 || '-',
        lateRegistration: reg.isLateRegistration || false,
        year: reg.year || '2025/2026',
        prcd: reg.prcd || 1,
        schoolId: decoded.schoolId,
      },
    });

    // 7. Fetch ALL updated post-registrations to return to client
    const allRegs = await prisma.postRegistration.findMany({
      where: { schoolId: decoded.schoolId },
      orderBy: { createdAt: 'desc' },
    });

    const mappedRegistrations = allRegs.map((r) => ({
      id: r.id,
      studentNumber: r.studentNumber,
      firstname: r.firstname,
      othername: r.othername || '',
      lastname: r.lastname,
      dateOfBirth: r.dateOfBirth,
      gender: r.gender,
      schoolType: r.schoolType,
      passport: r.passport,
      englishYear1: r.englishTerm1,
      englishYear2: r.englishTerm2,
      englishYear3: r.englishTerm3,
      arithmeticYear1: r.arithmeticTerm1,
      arithmeticYear2: r.arithmeticTerm2,
      arithmeticYear3: r.arithmeticTerm3,
      generalYear1: r.generalTerm1,
      generalYear2: r.generalTerm2,
      generalYear3: r.generalTerm3,
      religiousType: r.religiousType,
      religiousYear1: r.religiousTerm1,
      religiousYear2: r.religiousTerm2,
      religiousYear3: r.religiousTerm3,
      lateRegistration: r.lateRegistration,
      accCode: r.accCode,
    }));

    return NextResponse.json({
      isDuplicate: false,
      saved: {
        id: saved.id,
        studentNumber: saved.studentNumber,
        accCode: saved.accCode,
      },
      registrations: mappedRegistrations,
    }, { status: 201 });
  } catch (error) {
    console.error('Register post-student error:', error);
    return NextResponse.json(
      { error: 'Failed to register student. Please try again.' },
      { status: 500 }
    );
  }
}
