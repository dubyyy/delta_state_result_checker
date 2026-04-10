import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/reset-everything
 * 
 * Resets exam numbers for all schools:
 * - Recomputes the last 4 digits of student exam numbers for all schools
 * - Re-sorts alphabetically by surname then first name (0001, 0002, ...)
 */
export async function POST(req: NextRequest) {
  try {
    const { confirm } = await req.json();

    if (confirm !== "RESET_EVERYTHING") {
      return NextResponse.json(
        { error: "Invalid confirmation. Must provide 'RESET_EVERYTHING'" },
        { status: 400 }
      );
    }

    const results = {
      examNumbersReset: 0,
      schoolsProcessed: 0,
    };

    // Get all schools
    const schools = await prisma.school.findMany({
      select: {
        id: true,
        lgaCode: true,
        schoolCode: true,
        schoolName: true,
      },
    });

    if (schools.length === 0) {
      return NextResponse.json(
        { error: "No schools found in the system" },
        { status: 404 }
      );
    }

    // Process each school
    for (const school of schools) {
      try {
        // Reset exam numbers for this school
        const students = await prisma.studentRegistration.findMany({
          where: { schoolId: school.id },
          orderBy: [
            { lastname: "asc" },
            { firstname: "asc" },
          ],
        });

        if (students.length > 0) {
          // Sort case-insensitively
          const sorted = [...students].sort((a, b) => {
            const lastCmp = a.lastname.trim().toUpperCase().localeCompare(b.lastname.trim().toUpperCase());
            if (lastCmp !== 0) return lastCmp;
            return a.firstname.trim().toUpperCase().localeCompare(b.firstname.trim().toUpperCase());
          });

          // Get sequential codes for exam number prefix
          const schoolData = await prisma.schoolData.findFirst({
            where: {
              OR: [
                { lCode: school.lgaCode, schCode: school.schoolCode },
                { lgaCode: school.lgaCode, schCode: school.schoolCode },
              ],
            },
          });

          if (schoolData) {
            const prefix = `${schoolData.lgaCode}${schoolData.schCode.padStart(3, "0")}`;
            
            // Update exam numbers
            const updates = sorted.map((student, index) => {
              const newNumber = `${prefix}${(index + 1).toString().padStart(4, "0")}`;
              return {
                id: student.id,
                newNumber,
              };
            });

            // Two-phase raw SQL to avoid unique constraint violations
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

            results.examNumbersReset += updates.length;
            
          }
        }

        results.schoolsProcessed++;
      } catch (error) {
        console.error(`Error processing school ${school.schoolCode}:`, error);
        // Continue with other schools even if one fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Exam numbers reset completed successfully for all schools",
      results,
      summary: `Processed ${results.schoolsProcessed} schools and reset ${results.examNumbersReset} exam numbers.`,
    });
  } catch (error) {
    console.error("Error in reset everything:", error);
    return NextResponse.json(
      {
        error: "Failed to reset everything",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
