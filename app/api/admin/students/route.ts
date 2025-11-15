import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLGAName } from "@/lib/lga-mapping";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lga = searchParams.get("lga");
    const schoolCode = searchParams.get("schoolCode");
    
    // Build where clause
    const where: any = {};
    
    // Search by name or student number
    if (search) {
      where.OR = [
        {
          firstname: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          lastname: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          studentNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }
    
    // Filter by LGA
    if (lga && lga !== "all") {
      where.school = {
        lgaCode: lga,
      };
    }
    
    // Filter by school code
    if (schoolCode && schoolCode !== "all") {
      where.school = {
        ...where.school,
        schoolCode: schoolCode,
      };
    }
    
    const students = await prisma.studentRegistration.findMany({
      where,
      include: {
        school: {
          select: {
            schoolName: true,
            schoolCode: true,
            lgaCode: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    // Transform data for frontend
    const transformedStudents = students.map(student => ({
      id: student.id,
      name: `${student.firstname} ${student.othername || ""} ${student.lastname}`.trim(),
      lga: getLGAName(student.school.lgaCode),  // Convert code to full name
      schoolCode: student.school.schoolCode,
      schoolName: student.school.schoolName,
      examNumber: student.studentNumber,
      date: student.createdAt.toISOString().split("T")[0],
      gender: student.gender,
      schoolType: student.schoolType,
    }));
    
    return NextResponse.json(transformedStudents);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
