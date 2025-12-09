import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLGAName, getLGACode } from "@/lib/lga-mapping";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  // Rate limiting
  const rateLimitCheck = checkRateLimit(request, RATE_LIMITS.READ);
  if (!rateLimitCheck.allowed) {
    return rateLimitCheck.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const lga = searchParams.get("lga");
    const schoolCode = searchParams.get("schoolCode");
    const lateRegistration = searchParams.get("lateRegistration");
    
    // Pagination parameters
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000); // Max 1000 per page
    const skip = (page - 1) * limit;
    
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
    
    // Filter by late registration status
    if (lateRegistration && lateRegistration !== "all") {
      where.lateRegistration = lateRegistration === "true";
    }
    
    // Get total count for pagination metadata
    const [students, totalCount] = await Promise.all([
      prisma.studentRegistration.findMany({
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
        skip,
        take: limit,
      }),
      prisma.studentRegistration.count({ where }),
    ]);
    
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
    
    return NextResponse.json({
      data: transformedStudents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
