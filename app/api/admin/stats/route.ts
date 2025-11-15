import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Get total students count
    const totalStudents = await prisma.studentRegistration.count();
    
    // Get total schools count
    const totalSchools = await prisma.school.count();
    
    // Get registrations today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const registrationsToday = await prisma.studentRegistration.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });
    
    // Get registrations yesterday for comparison
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const registrationsYesterday = await prisma.studentRegistration.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });
    
    // Get registrations last month for comparison
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const studentsLastMonth = await prisma.studentRegistration.count({
      where: {
        createdAt: {
          lt: lastMonth,
        },
      },
    });
    
    // Calculate trends
    const studentTrend = studentsLastMonth > 0 
      ? Math.round(((totalStudents - studentsLastMonth) / studentsLastMonth) * 100)
      : 0;
    
    const todayTrend = registrationsYesterday > 0
      ? Math.round(((registrationsToday - registrationsYesterday) / registrationsYesterday) * 100)
      : 0;

    return NextResponse.json({
      totalStudents,
      totalSchools,
      registrationsToday,
      studentTrend,
      todayTrend,
      registrationStatus: "Open", // This could be from a settings table
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
