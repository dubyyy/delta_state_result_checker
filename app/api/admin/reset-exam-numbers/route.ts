import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import schoolsData from "@/data.json";

interface SchoolDataEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

/**
 * POST /api/admin/reset-exam-numbers
 * Body: { lgaCode: string, schoolCode: string }
 *
 * Recomputes the last 4 digits of studentNumber for all StudentRegistration
 * records belonging to the specified school, sorting alphabetically by
 * lastname then firstname.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lgaCode, schoolCode } = body;

    if (!lgaCode || !schoolCode) {
      return NextResponse.json(
        { error: "Both lgaCode and schoolCode are required." },
        { status: 400 }
      );
    }

    // Find the school in the School table
    const school = await prisma.school.findFirst({
      where: { lgaCode, schoolCode },
    });

    if (!school) {
      return NextResponse.json(
        { error: `School not found with lgaCode=${lgaCode}, schoolCode=${schoolCode}` },
        { status: 404 }
      );
    }

    // Look up the sequential lgaCode and schCode from SchoolData or data.json
    // These are needed to build the exam number prefix
    let seqLgaCode: string | null = null;
    let seqSchCode: string | null = null;

    // Try SchoolData table first
    const schoolData = await prisma.schoolData.findFirst({
      where: {
        OR: [
          { lCode: lgaCode, schCode: schoolCode },
          { lgaCode: lgaCode, schCode: schoolCode },
        ],
      },
    });

    if (schoolData) {
      seqLgaCode = schoolData.lgaCode;
      seqSchCode = schoolData.schCode;
    } else {
      // Fallback to data.json
      const schools = schoolsData as SchoolDataEntry[];
      const fromJson = schools.find(
        (s) => s.lCode === lgaCode && s.schCode === schoolCode
      );

      if (fromJson) {
        seqLgaCode = fromJson.lgaCode;
        seqSchCode = fromJson.schCode;
      }
    }

    if (!seqLgaCode || !seqSchCode) {
      return NextResponse.json(
        { error: "Could not resolve sequential LGA code and school code for exam number prefix. Check that the school exists in SchoolData or data.json." },
        { status: 404 }
      );
    }

    // Fetch all StudentRegistration records for this school
    const students = await prisma.studentRegistration.findMany({
      where: { schoolId: school.id },
      orderBy: [
        { lastname: "asc" },
        { firstname: "asc" },
      ],
    });

    if (students.length === 0) {
      return NextResponse.json(
        { error: "No student registrations found for this school." },
        { status: 404 }
      );
    }

    // Sort case-insensitively (Prisma orderBy is case-sensitive by default in PostgreSQL)
    const sorted = [...students].sort((a, b) => {
      const lastCmp = a.lastname.trim().toUpperCase().localeCompare(b.lastname.trim().toUpperCase());
      if (lastCmp !== 0) return lastCmp;
      return a.firstname.trim().toUpperCase().localeCompare(b.firstname.trim().toUpperCase());
    });

    // Build the prefix
    const prefix = `${seqLgaCode}${seqSchCode.padStart(3, "0")}`;

    // Prepare updates
    const updates = sorted.map((student, index) => {
      const newNumber = `${prefix}${(index + 1).toString().padStart(4, "0")}`;
      return {
        id: student.id,
        oldNumber: student.studentNumber,
        newNumber,
        name: `${student.lastname} ${student.firstname}`,
      };
    });

    // Execute all updates using two-phase raw SQL to avoid unique constraint violations
    // Phase 1: Set temporary unique values
    const tempWhen = updates
      .map((u) => `WHEN id = '${u.id}' THEN 'TEMP_' || id`)
      .join(" ");
    const idList = updates.map((u) => `'${u.id}'`).join(",");
    await prisma.$executeRawUnsafe(
      `UPDATE "StudentRegistration" SET "studentNumber" = CASE ${tempWhen} END, "updatedAt" = NOW() WHERE id IN (${idList})`
    );

    // Phase 2: Set final values
    const finalWhen = updates
      .map((u) => `WHEN id = '${u.id}' THEN '${u.newNumber}'`)
      .join(" ");
    await prisma.$executeRawUnsafe(
      `UPDATE "StudentRegistration" SET "studentNumber" = CASE ${finalWhen} END, "updatedAt" = NOW() WHERE id IN (${idList})`
    );

    return NextResponse.json({
      success: true,
      message: `Successfully reset exam numbers for ${updates.length} student(s) in ${school.schoolName || schoolCode}`,
      count: updates.length,
      schoolName: school.schoolName || schoolCode,
      preview: updates.slice(0, 10).map((u) => ({
        name: u.name,
        old: u.oldNumber,
        new: u.newNumber,
      })),
    });
  } catch (error) {
    console.error("Error resetting exam numbers:", error);
    return NextResponse.json(
      {
        error: "Failed to reset exam numbers",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
