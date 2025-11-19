import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET - List all access PINs
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const pins = await prisma.accessPin.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(pins, { status: 200 });
  } catch (error) {
    console.error('Error fetching access PINs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access PINs' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Delete or deactivate a PIN
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'PIN ID is required' },
        { status: 400 }
      );
    }

    // Soft delete by setting isActive to false
    await prisma.accessPin.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json(
      { message: 'PIN deactivated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deactivating PIN:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate PIN' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH - Reactivate a PIN
export async function PATCH(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: 'PIN ID is required' },
        { status: 400 }
      );
    }

    await prisma.accessPin.update({
      where: { id },
      data: { isActive: true },
    });

    return NextResponse.json(
      { message: 'PIN reactivated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error reactivating PIN:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate PIN' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
