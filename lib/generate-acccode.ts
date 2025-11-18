import { PrismaClient } from '@prisma/client';

/**
 * Generates a unique 10-digit account code for student registration
 * @param prisma - PrismaClient instance
 * @returns A unique 10-digit string
 */
export async function generateUniqueAccCode(prisma: PrismaClient): Promise<string> {
  let accCode: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    // Generate a random 10-digit number
    accCode = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    // Check if it already exists
    const existing = await prisma.studentRegistration.findUnique({
      where: { accCode },
      select: { id: true },
    });
    
    if (!existing) {
      isUnique = true;
      return accCode;
    }
    
    attempts++;
  }
  
  throw new Error('Failed to generate unique account code after multiple attempts');
}
