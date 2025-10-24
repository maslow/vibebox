import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

/**
 * Happy Account Connection Info API
 * GET /api/happy-accounts/connection - Get connection credentials
 *
 * Returns decrypted token and secret for connecting to Happy Server
 * This endpoint should be protected and only accessible to authenticated users
 *
 * #happy-account #connection #credentials
 */

/**
 * GET /api/happy-accounts/connection
 * Returns Happy connection credentials for current user
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Find user's Happy account
        const happyAccount = await prisma.happyAccount.findFirst({
            where: { userId: user.id },
        });

        if (!happyAccount) {
            throw errors.notFound('No Happy account found for user');
        }

        // Decrypt credentials
        const token = decrypt(happyAccount.happyToken);
        const secret = decrypt(happyAccount.happySecret);

        return successResponse({
            token,
            secret,
            machineId: happyAccount.machineId,
        });
    } catch (error) {
        console.error('[HAPPY] Failed to get connection info:', error);
        return errorResponse(error);
    }
}
