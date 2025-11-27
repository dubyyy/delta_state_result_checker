import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

interface JwtPayload {
  schoolId: string;
  lgaCode: string;
  schoolCode: string;
  schoolName: string;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;
    
    // Verify the student exists and belongs to this school
    const existingStudent = await prisma.studentRegistration.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (existingStudent.schoolId !== decoded.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only edit students from your school.' },
        { status: 403 }
      );
    }

    // Get updated data from request body
    const updateData = await req.json();

    console.log('Updating student ID:', studentId);
    console.log('Update data received:', updateData);

    // Validate required fields
    if (!updateData.firstname || !updateData.lastname || !updateData.gender) {
      return NextResponse.json(
        { error: 'Missing required fields: firstname, lastname, or gender' },
        { status: 400 }
      );
    }

    // Update the student record
    const updatedStudent = await prisma.studentRegistration.update({
      where: { id: studentId },
      data: {
        firstname: updateData.firstname,
        othername: updateData.othername || '',
        lastname: updateData.lastname,
        gender: updateData.gender,
        schoolType: updateData.schoolType,
        englishTerm1: updateData.englishTerm1,
        englishTerm2: updateData.englishTerm2,
        englishTerm3: updateData.englishTerm3,
        arithmeticTerm1: updateData.arithmeticTerm1,
        arithmeticTerm2: updateData.arithmeticTerm2,
        arithmeticTerm3: updateData.arithmeticTerm3,
        generalTerm1: updateData.generalTerm1,
        generalTerm2: updateData.generalTerm2,
        generalTerm3: updateData.generalTerm3,
        religiousType: updateData.religiousType,
        religiousTerm1: updateData.religiousTerm1,
        religiousTerm2: updateData.religiousTerm2,
        religiousTerm3: updateData.religiousTerm3,
        year: updateData.year || '2025/2026',
        prcd: updateData.prcd || 1,
      },
    });

    console.log('Student updated successfully:', updatedStudent.id);

    return NextResponse.json(
      {
        message: 'Student updated successfully',
        student: updatedStudent,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student update error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error details:', errorMessage);
    
    return NextResponse.json(
      { 
        error: 'Failed to update student. Please try again.',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: studentId } = await params;
    
    // Verify the student exists and belongs to this school
    const existingStudent = await prisma.studentRegistration.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    if (existingStudent.schoolId !== decoded.schoolId) {
      return NextResponse.json(
        { error: 'Unauthorized. You can only delete students from your school.' },
        { status: 403 }
      );
    }

    // Delete the student record
    await prisma.studentRegistration.delete({
      where: { id: studentId },
    });

    return NextResponse.json(
      { message: 'Student deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Student delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete student. Please try again.' },
      { status: 500 }
    );
  }
}
