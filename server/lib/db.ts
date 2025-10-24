import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton
 * Ensures only one instance of PrismaClient exists throughout the application
 *
 * #database #prisma #singleton
 */

declare global {
    // eslint-disable-next-line no-var
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}
