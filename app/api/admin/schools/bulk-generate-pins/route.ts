import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { generateAccessPin } from '@/lib/generate-pin';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Find all schools without an access PIN
    const schoolsWithoutPin = await prisma.school.findMany({
      where: {
        OR: [
          { accessPin: null },
          { accessPin: '' },
        ],
      },
    });

    if (schoolsWithoutPin.length === 0) {
      return NextResponse.json(
        { message: 'All schools already have access PINs', count: 0 },
        { status: 200 }
      );
    }

    // Generate PINs for all schools without them
    const updates = await Promise.all(
      schoolsWithoutPin.map(async (school) => {
        const newPin = generateAccessPin();
        return prisma.school.update({
          where: { id: school.id },
          data: { accessPin: newPin },
        });
      })
    );

    return NextResponse.json(
      {
        message: `Access PINs generated successfully for ${updates.length} school(s)`,
        count: updates.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Bulk PIN generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate access PINs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
