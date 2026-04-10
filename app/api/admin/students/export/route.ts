import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getLGAName, getLGACode } from '@/lib/lga-mapping';
import schoolsData from '@/data.json';

// Allow up to 5 minutes for very large exports (300K+ records)
export const maxDuration = 300;
export const runtime = 'nodejs';

const PAGE_SIZE = 5000;

// Build CSV row, escaping commas and quotes
function csvRow(fields: string[]): string {
  return fields.map(f => {
    const val = f ?? "";
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }).join(",") + "\n";
}

// CSV header row
const CSV_HEADERS = [
  "Year", "PRCD", "Student Number", "Access Code",
  "First Name", "Other Name", "Surname", "Gender",
  "ENG1", "ENG2", "ENG3",
  "ARIT1", "ARIT2", "ARIT3",
  "GP1", "GP2", "GP3",
  "RGS1", "RGS2", "RGS3",
  "rgsType", "schType", "schcode", "lgacode", "Date of Birth",
];

function buildWhereClause(searchParams: URLSearchParams) {
  const search = searchParams.get("search") || "";
  const lga = searchParams.get("lga");
  const schoolCode = searchParams.get("schoolCode");
  const registrationType = searchParams.get("registrationType");

  const studentWhere: any = {};

  if (search) {
    studentWhere.OR = [
      { firstname: { contains: search, mode: "insensitive" } },
      { lastname: { contains: search, mode: "insensitive" } },
      { studentNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (lga && lga !== "all") {
    const lgaCode = getLGACode(lga);
    if (lgaCode) {
      studentWhere.school = { lgaCode };
    }
  }

  if (schoolCode && schoolCode !== "all") {
    studentWhere.school = { ...studentWhere.school, schoolCode };
  }

  const shouldQueryRegular = !registrationType || registrationType === "all" || registrationType === "regular";
  const shouldQueryLate = !registrationType || registrationType === "all" || registrationType === "late";
  const shouldQueryPost = !registrationType || registrationType === "all" || registrationType === "post";

  return { studentWhere, shouldQueryRegular, shouldQueryLate, shouldQueryPost };
}

async function buildSchoolDataMap() {
  const allSchoolData = await prisma.schoolData.findMany({
    select: { lgaCode: true, lCode: true, schCode: true },
  });
  const schoolDataMap = new Map<string, string>();
  for (const sd of allSchoolData) {
    schoolDataMap.set(`${sd.lCode}-${sd.schCode}`, sd.lgaCode);
    schoolDataMap.set(`${sd.lgaCode}-${sd.schCode}`, sd.lgaCode);
  }
  for (const s of schoolsData as any[]) {
    const key1 = `${s.lCode}-${s.schCode}`;
    const key2 = `${s.lgaCode}-${s.schCode}`;
    if (!schoolDataMap.has(key1) && s.lgaCode) schoolDataMap.set(key1, String(s.lgaCode));
    if (!schoolDataMap.has(key2) && s.lgaCode) schoolDataMap.set(key2, String(s.lgaCode));
  }
  return schoolDataMap;
}

function makeStudentToCsvRow(schoolDataMap: Map<string, string>) {
  function resolveLCode(lgaCode: string, schCode: string): string {
    const normalizedSchCode = schCode.replace(/^0+/, "") || schCode;
    return schoolDataMap.get(`${lgaCode}-${schCode}`)
      || schoolDataMap.get(`${lgaCode}-${normalizedSchCode}`)
      || "";
  }

  return function studentToCsvRow(student: any): string {
    const religiousTypeCode = student.religiousType?.toLowerCase() === "christian" ? "1"
      : student.religiousType?.toLowerCase() === "islam" ? "2" : "";
    const lCode = resolveLCode(student.school.lgaCode, student.school.schoolCode);

    return csvRow([
      student.year || "",
      String(student.prcd || ""),
      student.studentNumber || "",
      student.accCode || "",
      student.firstname || "",
      student.othername || "",
      student.lastname || "",
      student.gender || "",
      student.englishTerm1 || "",
      student.englishTerm2 || "",
      student.englishTerm3 || "",
      student.arithmeticTerm1 || "",
      student.arithmeticTerm2 || "",
      student.arithmeticTerm3 || "",
      student.generalTerm1 || "",
      student.generalTerm2 || "",
      student.generalTerm3 || "",
      student.religiousTerm1 || "",
      student.religiousTerm2 || "",
      student.religiousTerm3 || "",
      religiousTypeCode,
      student.schoolType || "",
      student.school.schoolCode || "",
      lCode,
      student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString('en-GB') : "",
    ]);
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const countOnly = searchParams.get("countOnly") === "true";
    const pageParam = searchParams.get("page");
    const pageSizeParam = parseInt(searchParams.get("pageSize") || String(PAGE_SIZE));
    const pageSize = Math.min(Math.max(pageSizeParam, 100), 10000);

    const { studentWhere, shouldQueryRegular, shouldQueryLate, shouldQueryPost } = buildWhereClause(searchParams);

    const selectFields = {
      id: true,
      year: true,
      prcd: true,
      studentNumber: true,
      accCode: true,
      firstname: true,
      othername: true,
      lastname: true,
      gender: true,
      schoolType: true,
      dateOfBirth: true,
      englishTerm1: true,
      englishTerm2: true,
      englishTerm3: true,
      arithmeticTerm1: true,
      arithmeticTerm2: true,
      arithmeticTerm3: true,
      generalTerm1: true,
      generalTerm2: true,
      generalTerm3: true,
      religiousType: true,
      religiousTerm1: true,
      religiousTerm2: true,
      religiousTerm3: true,
      school: { select: { schoolName: true, schoolCode: true, lgaCode: true } },
    };

    // --- MODE 1: Count only (frontend uses this to know how many pages to fetch) ---
    if (countOnly) {
      const [regularCount, lateCount, postCount] = await Promise.all([
        shouldQueryRegular
          ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: false } })
          : 0,
        shouldQueryLate
          ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: true } })
          : 0,
        shouldQueryPost
          ? prisma.postRegistration.count({ where: { ...studentWhere } })
          : 0,
      ]);

      const total = regularCount + lateCount + postCount;
      return NextResponse.json({
        total,
        totalPages: Math.ceil(total / pageSize),
        pageSize,
      });
    }

    // --- MODE 2: Paginated export (frontend fetches one page at a time with retry) ---
    if (pageParam !== null) {
      const page = Math.max(parseInt(pageParam) || 1, 1);
      const skip = (page - 1) * pageSize;

      const schoolDataMap = await buildSchoolDataMap();
      const studentToCsvRow = makeStudentToCsvRow(schoolDataMap);

      // Fetch counts to determine which table the skip/take falls into
      const [regularCount, lateCount, postCount] = await Promise.all([
        shouldQueryRegular
          ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: false } })
          : 0,
        shouldQueryLate
          ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: true } })
          : 0,
        shouldQueryPost
          ? prisma.postRegistration.count({ where: { ...studentWhere } })
          : 0,
      ]);

      // Build a unified ordered list across tables using skip/take
      // Tables are ordered: regular → late → post
      const segments: { model: 'studentRegistration' | 'postRegistration'; where: any; count: number }[] = [];
      if (shouldQueryRegular) segments.push({ model: 'studentRegistration', where: { ...studentWhere, lateRegistration: false }, count: regularCount });
      if (shouldQueryLate) segments.push({ model: 'studentRegistration', where: { ...studentWhere, lateRegistration: true }, count: lateCount });
      if (shouldQueryPost) segments.push({ model: 'postRegistration', where: { ...studentWhere }, count: postCount });

      let remaining = pageSize;
      let globalSkip = skip;
      const allRows: any[] = [];

      for (const seg of segments) {
        if (remaining <= 0) break;

        if (globalSkip >= seg.count) {
          globalSkip -= seg.count;
          continue;
        }

        const take = Math.min(remaining, seg.count - globalSkip);
        const batch = await (prisma[seg.model] as any).findMany({
          where: seg.where,
          select: selectFields,
          orderBy: { id: "asc" as const },
          skip: globalSkip,
          take,
        });

        allRows.push(...batch);
        remaining -= batch.length;
        globalSkip = 0;
      }

      // Build CSV for this page
      let csv = "";
      if (page === 1) {
        csv += csvRow(CSV_HEADERS);
      }
      for (const student of allRows) {
        csv += studentToCsvRow(student);
      }

      return new Response(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Cache-Control": "no-cache",
        },
      });
    }

    // --- MODE 3: Full streaming download (fallback / direct link) ---
    const schoolDataMap = await buildSchoolDataMap();
    const studentToCsvRow = makeStudentToCsvRow(schoolDataMap);

    // Count total records upfront so the frontend can show % progress
    const [streamRegularCount, streamLateCount, streamPostCount] = await Promise.all([
      shouldQueryRegular
        ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: false } })
        : 0,
      shouldQueryLate
        ? prisma.studentRegistration.count({ where: { ...studentWhere, lateRegistration: true } })
        : 0,
      shouldQueryPost
        ? prisma.postRegistration.count({ where: { ...studentWhere } })
        : 0,
    ]);
    const totalRecords = streamRegularCount + streamLateCount + streamPostCount;
    // Estimate ~200 bytes per CSV row for Content-Length approximation
    const estimatedBytes = totalRecords * 200;

    const encoder = new TextEncoder();
    const tablesToStream: { model: 'studentRegistration' | 'postRegistration'; where: any }[] = [];
    if (shouldQueryRegular) {
      tablesToStream.push({ model: 'studentRegistration', where: { ...studentWhere, lateRegistration: false } });
    }
    if (shouldQueryLate) {
      tablesToStream.push({ model: 'studentRegistration', where: { ...studentWhere, lateRegistration: true } });
    }
    if (shouldQueryPost) {
      tablesToStream.push({ model: 'postRegistration', where: { ...studentWhere } });
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
          controller.enqueue(encoder.encode(csvRow(CSV_HEADERS)));

          for (const table of tablesToStream) {
            let cursor: string | undefined = undefined;

            while (true) {
              const queryArgs: any = {
                where: table.where,
                select: selectFields,
                orderBy: { id: "asc" as const },
                take: 2000,
              };

              if (cursor) {
                queryArgs.cursor = { id: cursor };
                queryArgs.skip = 1;
              }

              const batch: any[] = await (prisma[table.model] as any).findMany(queryArgs);
              if (batch.length === 0) break;

              let chunk = "";
              for (const student of batch) {
                chunk += studentToCsvRow(student);
              }
              controller.enqueue(encoder.encode(chunk));

              cursor = batch[batch.length - 1].id;
              if (batch.length < 2000) break;
            }
          }

          controller.close();
        } catch (err) {
          console.error("Export stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="students_export_${new Date().toISOString().split("T")[0]}.csv"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "X-Total-Records": String(totalRecords),
        "X-Estimated-Size": String(estimatedBytes),
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to export students", details: error instanceof Error ? error.message : "Unknown" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
