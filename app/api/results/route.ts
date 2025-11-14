import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';

// ==========================
//          GET
// ==========================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pinCode = searchParams.get('pinCode');
    const serialNumber = searchParams.get('serial');
    const examinationNumber = searchParams.get('examNumber');

    // Validate required fields
    if (!pinCode || !serialNumber || !examinationNumber) {
      return NextResponse.json(
        { error: 'Pin Code, Serial Number, and Examination Number are required.' },
        { status: 400 }
      );
    }

    // Query database
    const result = await prisma.result.findFirst({
      where: {
        pinCode,
        serialNumber,
        examinationNumber,
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
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const body = await request.json();

    const {
      year,
      candidateName,
      sex,
      school,
      lga,
      examinationNumber,
      englishGrade,
      mathGrade,
      generalPaperGrade,
      crsGrade,
      remark,
      pinCode,
      serialNumber,
      lgaExamNumber,
    } = body;

    if (!year || !candidateName || !examinationNumber) {
      return NextResponse.json(
        { error: 'Year, candidate name, and examination number are required.' },
        { status: 400 }
      );
    }

    const existingResult = await prisma.result.findUnique({
      where: { examinationNumber },
    });

    if (existingResult) {
      return NextResponse.json(
        { error: 'A result with this examination number already exists.' },
        { status: 409 }
      );
    }

    const result = await prisma.result.create({
      data: {
        year,
        candidateName,
        sex,
        school,
        lga,
        examinationNumber,
        englishGrade,
        mathGrade,
        generalPaperGrade,
        crsGrade,
        remark,
        pinCode,
        serialNumber,
        lgaExamNumber,
        userId,
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
