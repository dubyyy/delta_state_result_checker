import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { LGA_MAPPING } from '@/lib/lga-mapping';
import { checkDatabaseConnection } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

// Mapping from simplified LGA codes to full LGA codes
const SIMPLIFIED_TO_FULL_LGA: Record<string, string> = {
    "1": "1420256700", // Aniocha North
    "2": "660742704",  // Aniocha South
    "3": "99763601",   // Bomadi
    "4": "1830665512", // Burutu
    "5": "88169935",   // Ethiope East
    "6": "87907773",   // Ethiope West
    "7": "2077558841", // Ika North-East
    "8": "1918656250", // Ika South
    "9": "1583401849", // Isoko North
    "10": "1159914347", // Isoko South
    "11": "90249440",  // Ndokwa East
    "12": "1784211236", // Ndokwa West
    "13": "653025957", // Okpe
    "14": "1865127727", // Oshimili North
    "15": "1561094353", // Oshimili South
    "16": "1313680994", // Patani
    "17": "1776329831", // Sapele
    "18": "435624852",  // Udu
    "19": "1118545377", // Ughelli North
    "20": "803769815",  // Ughelli South
    "21": "1916789388", // Ukwuani
    "22": "1835037667", // Uvwie
    "23": "580987670",  // Warri North
    "24": "1031892114", // Warri South
    "25": "1563044454", // Warri South-West
};

function getFullLgaCode(simplifiedCode: string): string {
    // If it's already a full code (length > 6), return as is
    if (simplifiedCode.length > 6) {
        return simplifiedCode;
    }
    // Otherwise, look up the mapping
    return SIMPLIFIED_TO_FULL_LGA[simplifiedCode] || simplifiedCode;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    
    try {
        // Verify JWT token
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Authorization token required' },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const payload = verifyToken(token);
        if (!payload) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }

        // Check database connection first
        const dbConnected = await checkDatabaseConnection();
        if (!dbConnected) {
            return NextResponse.json(
                { error: 'Database connection failed' },
                { status: 503 }
            );
        }

        const lgaCode = searchParams.get('lgaCode');
        const year = searchParams.get('year');
        const schoolId = searchParams.get('schoolId');
        const type = searchParams.get('type') || 'student'; // 'student' or 'post'
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const skip = (page - 1) * limit;

        // Convert simplified LGA code to full LGA code
        const fullLgaCode = lgaCode ? getFullLgaCode(lgaCode) : null;

        if (!fullLgaCode && !schoolId) {
            return NextResponse.json(
                { error: 'LGA Code or School ID is required' },
                { status: 400 }
            );
        }

        // functionality to verify LGA code if provided
        if (lgaCode && !LGA_MAPPING[lgaCode]) {
            // Optional: we could validate, but maybe the mapping is not exhaustive?
            // For now, let's assume it's valid or strict check if needed.
        }

        // Build the query filter
        const whereClause: any = {};

        if (year) {
            whereClause.year = year;
        }

        // Filter by School
        if (schoolId) {
            whereClause.schoolId = schoolId;
        } else if (fullLgaCode) {
            // If filtering by LGA, we need to find all schools in that LGA first?
            // Or we can use the relation filtering if Prisma supports it efficiently.
            // schema: StudentRegistration -> School -> lgaCode
            whereClause.school = {
                lgaCode: fullLgaCode,
            };
        }

        // Get total count for pagination
        const total = type === 'post' 
            ? await prisma.postRegistration.count({ where: whereClause })
            : await prisma.studentRegistration.count({ where: whereClause });

        // Get data
        const students = type === 'post'
            ? await prisma.postRegistration.findMany({
                where: whereClause,
                include: {
                    school: {
                        select: {
                            schoolName: true,
                            lgaCode: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            })
            : await prisma.studentRegistration.findMany({
                where: whereClause,
                include: {
                    school: {
                        select: {
                            schoolName: true,
                            lgaCode: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: {
                    createdAt: 'desc',
                },
            });

        return NextResponse.json({
            data: students,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        console.error('Error details:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            lgaCode: searchParams.get('lgaCode'),
            type: searchParams.get('type'),
            page: searchParams.get('page'),
            limit: searchParams.get('limit')
        });
        return NextResponse.json(
            { error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
