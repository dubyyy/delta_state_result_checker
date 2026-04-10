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
 * Unified register-student endpoint.
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

    // 4. Generate student number
    const schools = schoolsData as SchoolData[];
    const schoolInfo = schools.find(
      (s) => s.lCode === decoded.lgaCode && s.schCode === decoded.schoolCode
    );
    if (!schoolInfo) {
      return NextResponse.json({ error: 'School data not found in registry' }, { status: 404 });
    }

    // Use lgaCode + schCode as prefix (matching frontend format)
    const x = schoolInfo.lgaCode;
    const fff = schoolInfo.schCode.padStart(3, '0');
    const schoolPrefix = `${x}${fff}`;

    // Alphabetical ordering with school-specific number ranges
    const { saved, mappedRegistrations } = await prisma.$transaction(async (tx) => {
      // Generate accCode
      const accCodes = await generateBatchAccCodes(tx as any, 1);

      // Get current registrations for THIS school only
      const currentRegs = await tx.studentRegistration.findMany({
        where: { schoolId: decoded.schoolId },
        select: { id: true, studentNumber: true, lastname: true, firstname: true },
      });

      // Build sorted list including new student
      const NEW_STUDENT_ID = '__NEW__';
      const allStudents = [
        ...currentRegs.map(r => ({ id: r.id, lastname: r.lastname, firstname: r.firstname })),
        { id: NEW_STUDENT_ID, lastname: reg.lastname, firstname: reg.firstname },
      ].sort((a, b) => {
        const lastCmp = a.lastname.trim().toUpperCase().localeCompare(b.lastname.trim().toUpperCase());
        if (lastCmp !== 0) return lastCmp;
        return a.firstname.trim().toUpperCase().localeCompare(b.firstname.trim().toUpperCase());
      });

      // Assign numbers based on sorted position
      const numberMap = new Map<string, string>();
      for (let i = 0; i < allStudents.length; i++) {
        numberMap.set(allStudents[i].id, `${schoolPrefix}${(i + 1).toString().padStart(4, '0')}`);
      }

      const finalNumber = numberMap.get(NEW_STUDENT_ID)!;

      // Create with temporary unique number first
      const tempNumber = `TEMP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const savedRecord = await tx.studentRegistration.create({
        data: {
          accCode: accCodes[0],
          studentNumber: tempNumber,
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

      // Renumber ALL students for this school in alphabetical order
      // Use raw SQL to update all at once with a CASE statement
      const allIds = allStudents.map(s => s.id === NEW_STUDENT_ID ? savedRecord.id : s.id);
      const caseStatements = allStudents.map(s => {
        const actualId = s.id === NEW_STUDENT_ID ? savedRecord.id : s.id;
        const correctNumber = numberMap.get(s.id)!;
        return `WHEN id = '${actualId}' THEN '${correctNumber}'`;
      }).join(' ');
      const idList = allIds.map(id => `'${id}'`).join(', ');
      
      // First set all to temp values to clear conflicts
      await tx.$executeRawUnsafe(
        `UPDATE "StudentRegistration" SET "studentNumber" = CONCAT('TEMP_', id) WHERE id IN (${idList})`
      );
      
      // Then set to final values
      await tx.$executeRawUnsafe(
        `UPDATE "StudentRegistration" SET "studentNumber" = CASE ${caseStatements} END, "updatedAt" = NOW() WHERE id IN (${idList})`
      );

      // Fetch the updated saved record with correct student number
      const updatedSavedRecord = await tx.studentRegistration.findUnique({
        where: { id: savedRecord.id },
      });

      // Fetch all registrations
      const allRegs = await tx.studentRegistration.findMany({
        where: { schoolId: decoded.schoolId },
        orderBy: { createdAt: 'desc' },
      });

      const mapped = allRegs.map((r) => ({
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

      return { saved: updatedSavedRecord!, mappedRegistrations: mapped };
    }, {
      isolationLevel: 'Serializable',
      timeout: 30000,
    });

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
    console.error('Register student error:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to register student. Please try again.',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    );
  }
}
