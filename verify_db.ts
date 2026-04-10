import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
    console.log("Starting DB verification...");
    try {
        const studentCount = await prisma.studentRegistration.count();
        const postCount = await prisma.postRegistration.count();
        const total = studentCount + postCount;

        console.log(`StudentRegistration count: ${studentCount}`);
        console.log(`PostRegistration count: ${postCount}`);
        console.log(`Total DB records: ${total}`);
    } catch (error) {
        console.error("DB verification failed:", error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
