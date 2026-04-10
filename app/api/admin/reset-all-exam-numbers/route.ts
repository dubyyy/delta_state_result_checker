import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/admin/reset-all-exam-numbers
 *
 * Resets exam numbers for ALL schools using Server-Sent Events for progress.
 * - Recomputes the last 4 digits of student exam numbers for every school
 * - Re-sorts students alphabetically by surname then first name (0001, 0002, …)
 * - Streams progress updates to the client in real-time
 */
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      try {
        const body = await req.json().catch(() => ({}));
        const { confirm } = body;

        if (confirm !== "RESET_ALL_EXAM_NUMBERS") {
          send("error", { error: "Invalid confirmation." });
          controller.close();
          return;
        }

        send("progress", {
          step: "loading",
          message: "Loading school data...",
          percent: 0,
        });

        // 1. Load all SchoolData rows so we can map (lCode, schCode) → prefix
        const allSchoolData = await prisma.schoolData.findMany({
          select: { lgaCode: true, lCode: true, schCode: true },
        });

        const prefixMap = new Map<string, string>();
        for (const sd of allSchoolData) {
          const key = `${sd.lCode}|${sd.schCode}`;
          prefixMap.set(key, `${sd.lgaCode}${sd.schCode.padStart(3, "0")}`);
        }

        send("progress", {
          step: "loading",
          message: `Loaded ${allSchoolData.length} school data entries. Loading schools...`,
          percent: 5,
        });

        // 2. Load all schools
        const schools = await prisma.school.findMany({
          select: { id: true, lgaCode: true, schoolCode: true, schoolName: true },
        });

        if (schools.length === 0) {
          send("error", { error: "No schools found in the system" });
          controller.close();
          return;
        }

        send("progress", {
          step: "loading",
          message: `Found ${schools.length} schools. Loading student registrations...`,
          percent: 10,
        });

        // 3. Load ALL student registrations in one query
        const allStudents = await prisma.studentRegistration.findMany({
          select: {
            id: true,
            studentNumber: true,
            firstname: true,
            lastname: true,
            schoolId: true,
          },
        });

        send("progress", {
          step: "processing",
          message: `Loaded ${allStudents.length} students. Processing schools...`,
          percent: 20,
        });

        // Group students by schoolId
        const studentsBySchool = new Map<
          string,
          { id: string; studentNumber: string; firstname: string; lastname: string }[]
        >();
        for (const s of allStudents) {
          const list = studentsBySchool.get(s.schoolId) || [];
          list.push(s);
          studentsBySchool.set(s.schoolId, list);
        }

        // 4. Build all update operations
        const updates: { id: string; newNumber: string }[] = [];
        let schoolsProcessed = 0;
        let schoolsSkipped = 0;

        for (let si = 0; si < schools.length; si++) {
          const school = schools[si];
          const prefix = prefixMap.get(`${school.lgaCode}|${school.schoolCode}`);
          if (!prefix) {
            schoolsSkipped++;
            continue;
          }

          const students = studentsBySchool.get(school.id);
          if (!students || students.length === 0) {
            schoolsProcessed++;
            continue;
          }

          // Sort case-insensitively by lastname then firstname
          const sorted = [...students].sort((a, b) => {
            const lastCmp = a.lastname
              .trim()
              .toUpperCase()
              .localeCompare(b.lastname.trim().toUpperCase());
            if (lastCmp !== 0) return lastCmp;
            return a.firstname
              .trim()
              .toUpperCase()
              .localeCompare(b.firstname.trim().toUpperCase());
          });

          for (let i = 0; i < sorted.length; i++) {
            const newNumber = `${prefix}${(i + 1).toString().padStart(4, "0")}`;
            if (sorted[i].studentNumber !== newNumber) {
              updates.push({ id: sorted[i].id, newNumber });
            }
          }

          schoolsProcessed++;

          // Send progress every 50 schools
          if ((si + 1) % 50 === 0 || si === schools.length - 1) {
            const pct = 20 + Math.round(((si + 1) / schools.length) * 30);
            send("progress", {
              step: "processing",
              message: `Processed ${si + 1}/${schools.length} schools (${updates.length} numbers to update)...`,
              percent: pct,
              schoolsProcessed,
              schoolsSkipped,
            });
          }
        }

        send("progress", {
          step: "updating",
          message: `Updating ${updates.length} exam numbers in database...`,
          percent: 55,
          totalUpdates: updates.length,
        });

        // 5. Execute updates in batched raw SQL to avoid unique constraint violations.
        //    Phase 1: Set studentNumber to a temporary unique value (TEMP_ + id).
        //    Phase 2: Set studentNumber to the final value.
        //    This two-phase approach prevents collisions when reordering.
        const BATCH_SIZE = 500;
        let totalUpdated = 0;
        const totalBatches = Math.ceil(updates.length / BATCH_SIZE) * 2; // 2 phases
        let batchCount = 0;

        // Phase 1: Assign temporary values
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
          const batch = updates.slice(i, i + BATCH_SIZE);
          batchCount++;

          // Build a single UPDATE with CASE for the batch
          const whenClauses = batch
            .map((u) => `WHEN id = '${u.id}' THEN 'TEMP_' || id`)
            .join(" ");
          const idList = batch.map((u) => `'${u.id}'`).join(",");

          await prisma.$executeRawUnsafe(
            `UPDATE "StudentRegistration" SET "studentNumber" = CASE ${whenClauses} END, "updatedAt" = NOW() WHERE id IN (${idList})`
          );

          const pct = 55 + Math.round((batchCount / totalBatches) * 40);
          send("progress", {
            step: "updating",
            message: `Phase 1 - Clearing batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(updates.length / BATCH_SIZE)} (preparing for reorder)...`,
            percent: Math.min(pct, 90),
            totalUpdated,
          });
        }

        // Phase 2: Assign final values
        for (let i = 0; i < updates.length; i += BATCH_SIZE) {
          const batch = updates.slice(i, i + BATCH_SIZE);
          batchCount++;

          const whenClauses = batch
            .map((u) => `WHEN id = '${u.id}' THEN '${u.newNumber}'`)
            .join(" ");
          const idList = batch.map((u) => `'${u.id}'`).join(",");

          await prisma.$executeRawUnsafe(
            `UPDATE "StudentRegistration" SET "studentNumber" = CASE ${whenClauses} END, "updatedAt" = NOW() WHERE id IN (${idList})`
          );
          totalUpdated += batch.length;

          const pct = 55 + Math.round((batchCount / totalBatches) * 40);
          send("progress", {
            step: "updating",
            message: `Phase 2 - Assigning batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(updates.length / BATCH_SIZE)} (${totalUpdated}/${updates.length} updated)...`,
            percent: Math.min(pct, 95),
            totalUpdated,
          });
        }

        send("done", {
          success: true,
          message: "Exam numbers reset completed successfully for all schools",
          results: {
            schoolsProcessed,
            schoolsSkipped,
            examNumbersReset: totalUpdated,
          },
          percent: 100,
        });
        
      } catch (error) {
        console.error("Error in reset all exam numbers:", error);
        send("error", {
          error: "Failed to reset all exam numbers",
          details: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
