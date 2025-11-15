import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLGAName } from "@/lib/lga-mapping";

export async function GET() {
  try {
    // Get all schools with their student counts
    const schools = await prisma.school.findMany({
      include: {
        _count: {
          select: {
            studentRegistrations: true,
          },
        },
      },
    });
    
    // Group by LGA
    const lgaStats = schools.reduce((acc: any, school) => {
      const lgaCode = school.lgaCode;
      const lgaName = getLGAName(lgaCode);
      
      if (!acc[lgaCode]) {
        acc[lgaCode] = {
          lga: lgaName,  // Use the full name instead of code
          students: 0,
          schools: 0,
        };
      }
      
      acc[lgaCode].students += school._count.studentRegistrations;
      acc[lgaCode].schools += 1;
      
      return acc;
    }, {});
    
    // Convert to array and sort by student count
    const lgaArray = Object.values(lgaStats).sort((a: any, b: any) => 
      b.students - a.students
    );
    
    return NextResponse.json(lgaArray);
  } catch (error) {
    console.error("Error fetching LGA stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch LGA statistics" },
      { status: 500 }
    );
  }
}
