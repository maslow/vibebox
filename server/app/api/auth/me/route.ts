import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse } from '@/lib/errors';

/**
 * GET /api/auth/me
 * Returns current authenticated user information
 *
 * #auth #user #api
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        return successResponse({
            id: user.id,
            logtoId: user.logtoId,
            email: user.email,
            name: user.name,
            picture: user.picture,
            subscription: user.subscription,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
