import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { prisma } from '@/lib/db';

/**
 * Users List API
 * GET /api/users - List all users (admin only, future feature)
 *
 * #user #admin #api
 */

/**
 * GET /api/users
 * Returns list of users (currently just returns current user)
 * TODO: Add admin role check and pagination
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // For now, just return current user
        // In the future, this should check admin role and return paginated user list
        return successResponse({
            users: [
                {
                    id: user.id,
                    logtoId: user.logtoId,
                    email: user.email,
                    name: user.name,
                    picture: user.picture,
                    subscription: user.subscription,
                    createdAt: user.createdAt,
                    updatedAt: user.updatedAt,
                },
            ],
            total: 1,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
