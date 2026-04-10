import { NextResponse } from "next/server";
import { generateToken } from "@/lib/jwt";
import schoolsData from "@/data.json";

interface SchoolEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

export async function POST(request: Request) {
  try {
    const { lgaCode, icode } = await request.json();

    if (!lgaCode || !icode) {
      return NextResponse.json(
        { error: "LGA and icode are required" },
        { status: 400 }
      );
    }

    const schools = schoolsData as SchoolEntry[];

    // Find school that matches both lgaCode and lCode (now called icode)
    const school = schools.find(s => s.lgaCode === lgaCode && s.lCode === icode);

    if (!school) {
      return NextResponse.json(
        { error: "Invalid LGA or icode" },
        { status: 401 }
      );
    }

    // Generate JWT token with school information
    const token = generateToken({
      schoolId: school.id,
      lgaCode: school.lgaCode,
      schoolCode: school.schCode,
      schoolName: school.schName,
    });

    return NextResponse.json({
      success: true,
      token,
      school: {
        id: school.id,
        lgaCode: school.lgaCode,
        schoolCode: school.schCode,
        schoolName: school.schName,
      }
    });

  } catch (error) {
    console.error("CIE auth error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
