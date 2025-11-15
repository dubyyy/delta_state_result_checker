import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getLGAName } from "@/lib/lga-mapping";

export async function GET() {
  try {
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            studentRegistrations: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Transform data for frontend
    const transformedSchools = schools.map(school => ({
      id: school.id,
      name: school.schoolName,
      code: school.schoolCode,
      lga: getLGAName(school.lgaCode),  // Convert code to full name
      studentCount: school._count.studentRegistrations,
      status: "Open", // This could be a field in the School model if needed
      createdAt: school.createdAt,
    }));
    
    return NextResponse.json(transformedSchools);
  } catch (error) {
    console.error("Error fetching schools:", error);
    return NextResponse.json(
      { error: "Failed to fetch schools" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, code, lga } = body;
    
    if (!name || !code || !lga) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check if school code already exists
    const existing = await prisma.school.findUnique({
      where: {
        lgaCode_schoolCode: {
          lgaCode: lga,
          schoolCode: code,
        },
      },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "School code already exists in this LGA" },
        { status: 400 }
      );
    }
    
    // Generate default password (you may want to customize this)
    const defaultPassword = `${code.toLowerCase()}123`;
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);
    
    const school = await prisma.school.create({
      data: {
        schoolName: name,
        schoolCode: code,
        lgaCode: lga,
        password: hashedPassword,
      },
    });
    
    return NextResponse.json({
      id: school.id,
      name: school.schoolName,
      code: school.schoolCode,
      lga: school.lgaCode,
      studentCount: 0,
      status: "Open",
      createdAt: school.createdAt,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating school:", error);
    return NextResponse.json(
      { error: "Failed to create school" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json(
        { error: "School ID is required" },
        { status: 400 }
      );
    }
    
    await prisma.school.delete({
      where: { id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting school:", error);
    return NextResponse.json(
      { error: "Failed to delete school" },
      { status: 500 }
    );
  }
}
