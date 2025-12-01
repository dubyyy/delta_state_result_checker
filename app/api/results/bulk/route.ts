import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/utils/auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

interface CSVRow {
  SESSIONYR: string;
  FNAME: string;
  MNAME: string;
  LNAME: string;
  SEXCD: string;
  INSTITUTIONCD: string;
  SCHOOLNAME: string;
  LGACD: string;
  EXAMINATIONNO: string;
  ENG: string;
  ENGGRD: string;
  ARIT: string;
  ARITGRD: string;
  GP: string;
  GPGRD: string;
  RGS: string;
  RGSGRD: string;
  REMARK: string;
  ACCCESS_PIN: string;
}

function parseCSV(csvText: string): CSVRow[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  const headers = lines[0].split(',').map(h => h.trim());
  const rows: CSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    if (values.length !== headers.length) {
      continue; // Skip malformed rows
    }

    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index];
    });
    rows.push(row as CSVRow);
  }

  return rows;
}

function mapCSVRowToResult(row: CSVRow, userId: string | null) {
  // Combine first name, middle name, and last name
  const candidateName = [row.FNAME, row.MNAME, row.LNAME]
    .filter(Boolean)
    .join(' ');

  return {
    year: row.SESSIONYR,
    candidateName,
    sex: row.SEXCD,
    school: row.SCHOOLNAME,
    lga: row.LGACD,
    examinationNumber: row.EXAMINATIONNO,
    englishGrade: row.ENGGRD,
    mathGrade: row.ARITGRD,
    generalPaperGrade: row.GPGRD,
    crsGrade: row.RGSGRD,
    remark: row.REMARK,
    pinCode: row.ACCCESS_PIN,
    serialNumber: null,
    lgaExamNumber: null,
    userId,
  };
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.MUTATION);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are accepted' },
        { status: 400 }
      );
    }

    const csvText = await file.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'No valid data found in CSV' },
        { status: 400 }
      );
    }

    // Validate and prepare data
    const resultsToCreate = [];
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      if (!row.SESSIONYR || !row.EXAMINATIONNO || (!row.FNAME && !row.LNAME)) {
        errors.push({
          row: i + 2, // +2 because index 0 is headers and array is 0-indexed
          error: 'Missing required fields (SESSIONYR, EXAMINATIONNO, or name)',
        });
        continue;
      }

      // Check if examination number already exists
      const existing = await prisma.result.findUnique({
        where: { examinationNumber: row.EXAMINATIONNO },
      });

      if (existing) {
        errors.push({
          row: i + 2,
          error: `Examination number ${row.EXAMINATIONNO} already exists`,
        });
        continue;
      }

      resultsToCreate.push(mapCSVRowToResult(row, userId));
    }

    // Bulk create results
    let createdCount = 0;
    if (resultsToCreate.length > 0) {
      const result = await prisma.result.createMany({
        data: resultsToCreate,
        skipDuplicates: true,
      });
      createdCount = result.count;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdCount} results`,
      created: createdCount,
      errors: errors.length > 0 ? errors : undefined,
      totalProcessed: rows.length,
    }, { status: 201 });

  } catch (error) {
    console.error('Error processing CSV:', error);
    return NextResponse.json(
      {
        error: 'Failed to process CSV file',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
