import { NextRequest, NextResponse } from 'next/server';
import { verifyLogtoToken, extractBearerToken } from './logto';
import { prisma } from '@/lib/db';
import { AuthContext } from './types';
import { errors } from '@/lib/errors';

/**
 * Require authentication middleware
 * Verifies Logto token and ensures user exists in database
 * Automatically creates user on first login
 *
 * #auth #middleware #logto
 */
export async function requireAuth(
    request: NextRequest
): Promise<AuthContext | NextResponse> {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    console.log('[AUTH] Auth header:', authHeader?.substring(0, 50));
    console.log('[AUTH] Token:', token?.substring(0, 50));

    if (!token) {
        console.log('[AUTH] No token found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const logtoUser = await verifyLogtoToken(token);

        // Upsert user - create if doesn't exist, update if exists
        // This handles duplicate email gracefully by updating based on logtoId
        const user = await prisma.user.upsert({
            where: { logtoId: logtoUser.sub },
            update: {
                email: logtoUser.email || '',
                name: logtoUser.name,
                picture: logtoUser.picture,
            },
            create: {
                logtoId: logtoUser.sub,
                email: logtoUser.email || '',
                name: logtoUser.name,
                picture: logtoUser.picture,
            },
        });

        return { logtoUser, user };
    } catch (error) {
        console.error('[AUTH] Token verification failed:', error);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}

/**
 * Optional authentication middleware
 * Returns auth context if valid token present, otherwise returns null
 */
export async function optionalAuth(
    request: NextRequest
): Promise<AuthContext | null> {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
        return null;
    }

    try {
        const logtoUser = await verifyLogtoToken(token);
        const user = await prisma.user.findUnique({
            where: { logtoId: logtoUser.sub },
        });

        if (!user) {
            return null;
        }

        return { logtoUser, user };
    } catch (error) {
        return null;
    }
}
