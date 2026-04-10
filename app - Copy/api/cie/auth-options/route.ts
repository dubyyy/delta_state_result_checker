import { NextResponse } from "next/server";
import schoolsData from "@/data.json";
import { LGA_MAPPING } from "@/lib/lga-mapping";

interface SchoolEntry {
  lgaCode: string;
  lCode: string;
  schCode: string;
  progID: string;
  schName: string;
  id: string;
}

export async function GET() {
  try {
    const schools = schoolsData as SchoolEntry[];

    const byLgaCode = new Map<
      string,
      { lgaCode: string; lCodes: Set<string> }
    >();

    for (const s of schools) {
      const current = byLgaCode.get(s.lgaCode);
      if (!current) {
        byLgaCode.set(s.lgaCode, { lgaCode: s.lgaCode, lCodes: new Set([s.lCode]) });
      } else {
        current.lCodes.add(s.lCode);
      }
    }

    const data = [...byLgaCode.values()]
      .map((v) => {
        const lCodes = [...v.lCodes.values()].sort((a, b) => a.localeCompare(b));
        const primaryLCode = lCodes[0] || "";

        return {
          lgaCode: v.lgaCode,
          lgaName: LGA_MAPPING[primaryLCode] || v.lgaCode,
          lCodes,
        };
      })
      .sort((a, b) => a.lgaName.localeCompare(b.lgaName));

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error building CIE auth options:", error);
    return NextResponse.json(
      { error: "Failed to build auth options" },
      { status: 500 }
    );
  }
}
