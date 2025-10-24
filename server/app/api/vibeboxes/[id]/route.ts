import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { getVibeBox, deleteVibeBox } from '@/lib/vibebox/provisioning';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * VibeBox Detail API
 * GET /api/vibeboxes/[id] - Get VibeBox details
 * PUT /api/vibeboxes/[id] - Update VibeBox
 * DELETE /api/vibeboxes/[id] - Delete VibeBox
 *
 * #vibebox #api #detail
 */

const updateVibeBoxSchema = z.object({
    name: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    sshPort: z.number().int().min(1).max(65535).optional(),
});

/**
 * GET /api/vibeboxes/[id]
 * Returns VibeBox details
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;
        const vibeBoxId = params.id;

        // Get VibeBox
        const vibeBox = await getVibeBox(vibeBoxId);

        if (!vibeBox) {
            throw errors.notFound('VibeBox not found');
        }

        // Verify ownership
        if (vibeBox.userId !== user.id) {
            throw errors.forbidden('Access denied');
        }

        return successResponse(vibeBox);
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * PUT /api/vibeboxes/[id]
 * Updates VibeBox information
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;
        const vibeBoxId = params.id;

        // Get VibeBox
        const vibeBox = await getVibeBox(vibeBoxId);

        if (!vibeBox) {
            throw errors.notFound('VibeBox not found');
        }

        // Verify ownership
        if (vibeBox.userId !== user.id) {
            throw errors.forbidden('Access denied');
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = updateVibeBoxSchema.parse(body);

        // Update VibeBox
        const updatedVibeBox = await prisma.vibeBox.update({
            where: { id: vibeBoxId },
            data: {
                name: validatedData.name,
                ipAddress: validatedData.ipAddress,
                sshPort: validatedData.sshPort,
            },
        });

        return successResponse(updatedVibeBox);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw errors.badRequest('Invalid VibeBox data');
        }
        return errorResponse(error);
    }
}

/**
 * DELETE /api/vibeboxes/[id]
 * Deletes VibeBox
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;
        const vibeBoxId = params.id;

        // Get VibeBox
        const vibeBox = await getVibeBox(vibeBoxId);

        if (!vibeBox) {
            throw errors.notFound('VibeBox not found');
        }

        // Verify ownership
        if (vibeBox.userId !== user.id) {
            throw errors.forbidden('Access denied');
        }

        // Delete VibeBox
        await deleteVibeBox(vibeBoxId);

        return successResponse({
            message: 'VibeBox deleted successfully',
        });
    } catch (error) {
        return errorResponse(error);
    }
}
