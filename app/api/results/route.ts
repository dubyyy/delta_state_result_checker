import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

// ==========================
//          GET
// ==========================
export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.READ);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');
    const serialNumber = searchParams.get('serial');
    const examinationNumber = searchParams.get('examNumber');

    // Validate required fields
    if (!pinCode || !examinationNumber) {
      return NextResponse.json(
        { error: 'Access Pin and Examination Number are required.' },
        { status: 400 }
      );
    }

    // Query database
    const result = await prisma.result.findFirst({
      where: {
        accessPin: pinCode,
        examinationNo: examinationNumber,
      },
    });

    if (!result) {
      return NextResponse.json(
        { error: 'No result found with the provided credentials.' },
        { status: 404 }
      );
    }

    // ✅ Return ONLY the result object
    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Error fetching result:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch result. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// ==========================
//          POST
// ==========================
export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.MUTATION);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const body = await request.json();

    const {
      sessionYr,
      fName,
      mName,
      lName,
      sexCd,
      institutionCd,
      schoolName,
      lgaCd,
      examinationNo,
      eng,
      engGrd,
      arit,
      aritGrd,
      gp,
      gpGrd,
      rgs,
      rgsGrd,
      remark,
      accessPin,
    } = body;

    if (!sessionYr || !examinationNo || (!fName && !lName)) {
      return NextResponse.json(
        { error: 'Session year, examination number, and at least one name field are required.' },
        { status: 400 }
      );
    }

    const existingResult = await prisma.result.findUnique({
      where: { examinationNo },
    });

    if (existingResult) {
      return NextResponse.json(
        { error: 'A result with this examination number already exists.' },
        { status: 409 }
      );
    }

    const result = await prisma.result.create({
      data: {
        sessionYr,
        fName,
        mName,
        lName,
        sexCd,
        institutionCd,
        schoolName,
        lgaCd,
        examinationNo,
        eng: eng ? parseFloat(eng) : null,
        engGrd,
        arit: arit ? parseFloat(arit) : null,
        aritGrd,
        gp: gp ? parseFloat(gp) : null,
        gpGrd,
        rgs: rgs ? parseFloat(rgs) : null,
        rgsGrd,
        remark,
        accessPin,
      },
    });

    // ✅ Return ONLY the created result object
    return NextResponse.json(result, { status: 201 });

  } catch (error) {
    console.error('Error creating result:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit result. Please try again.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
