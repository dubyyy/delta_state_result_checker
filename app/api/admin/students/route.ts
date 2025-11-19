import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLGAName, getLGACode } from "@/lib/lga-mapping";

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
      // Convert LGA name to code (frontend sends names, backend uses codes)
      const lgaCode = getLGACode(lga);
      if (lgaCode) {
        where.school = {
          lgaCode: lgaCode,
        };
      }
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
      accCode: student.accCode,
      studentNumber: student.studentNumber,
      firstname: student.firstname,
      othername: student.othername,
      lastname: student.lastname,
      gender: student.gender,
      schoolType: student.schoolType,
      passport: student.passport,
      
      // English scores
      englishTerm1: student.englishTerm1,
      englishTerm2: student.englishTerm2,
      englishTerm3: student.englishTerm3,
      
      // Arithmetic scores
      arithmeticTerm1: student.arithmeticTerm1,
      arithmeticTerm2: student.arithmeticTerm2,
      arithmeticTerm3: student.arithmeticTerm3,
      
      // General Paper scores
      generalTerm1: student.generalTerm1,
      generalTerm2: student.generalTerm2,
      generalTerm3: student.generalTerm3,
      
      // Religious Studies
      religiousType: student.religiousType,
      religiousTerm1: student.religiousTerm1,
      religiousTerm2: student.religiousTerm2,
      religiousTerm3: student.religiousTerm3,
      
      // Year and PRCD
      prcd: student.prcd,
      year: student.year,
      
      // Additional info for filters
      lga: getLGAName(student.school.lgaCode),
      schoolCode: student.school.schoolCode,
      schoolName: student.school.schoolName,
      date: student.createdAt.toISOString().split("T")[0],
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
