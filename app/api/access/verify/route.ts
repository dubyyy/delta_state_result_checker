export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import schoolsData from '@/data.json';


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
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { lgaCode, schoolCode, accessPin } = body as {
      lgaCode?: string;
      schoolCode?: string;
      accessPin?: string;
    };

    // Validate input
    if (!lgaCode || !schoolCode || !accessPin) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Verify password
    if (accessPin !== 'delta') {
      return NextResponse.json(
        { error: 'Invalid password. Please try again.' },
        { status: 401 }
      );
    }

    // Validate against data.json
    const schools = schoolsData as SchoolData[];
    const schoolData = schools.find(
      (s) => s.lCode === lgaCode && s.schCode === schoolCode
    );

    if (!schoolData) {
      return NextResponse.json(
        { error: 'Invalid LGA code or school code. Please check your credentials.' },
        { status: 404 }
      );
    }

    // Check if school exists in database (optional - for registration tracking)
    let school = null;
    try {
      school = await prisma.school.findFirst({
        where: {
          lgaCode,
          schoolCode,
        },
      });
    } catch (dbError) {
      console.warn('Database lookup failed (non-critical):', dbError instanceof Error ? dbError.message : dbError);
    }
    
    // Generate JWT token
    const token = jwt.sign(
      {
        schoolId: school?.id,
        lgaCode,
        schoolCode,
        schoolName: schoolData.schName,
        isRegistered: !!school,
      },
      process.env.JWT_SECRET || 'your-secret-key-change-this',
      { expiresIn: '7d' }
    );

    return NextResponse.json(
      {
        message: 'Access granted',
        token,
        school: {
          id: school?.id,
          lgaCode,
          schoolCode,
          schoolName: schoolData.schName,
          isRegistered: !!school,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorId = crypto && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.error('Access verification error:', { errorId, error });

    return NextResponse.json(
      {
        error: 'Internal server error',
        errorId,
        details:
          process.env.NODE_ENV === 'production'
            ? undefined
            : error instanceof Error
              ? error.message
              : String(error),
      },
      { status: 500 }
    );
  }
}
