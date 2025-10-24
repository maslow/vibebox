import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * User Profile API
 * GET /api/users/profile - Get current user profile
 * PUT /api/users/profile - Update current user profile
 *
 * #user #profile #api
 */

const updateProfileSchema = z.object({
    name: z.string().optional(),
    picture: z.string().url().optional(),
});

/**
 * GET /api/users/profile
 * Returns current user's profile information
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

/**
 * PUT /api/users/profile
 * Updates current user's profile information
 */
export async function PUT(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = updateProfileSchema.parse(body);

        // Update user profile
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                name: validatedData.name,
                picture: validatedData.picture,
            },
        });

        return successResponse({
            id: updatedUser.id,
            logtoId: updatedUser.logtoId,
            email: updatedUser.email,
            name: updatedUser.name,
            picture: updatedUser.picture,
            subscription: updatedUser.subscription,
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw errors.badRequest('Invalid profile data');
        }
        return errorResponse(error);
    }
}
