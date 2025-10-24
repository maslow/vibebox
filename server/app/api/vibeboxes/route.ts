import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { provisionVibeBox, getUserVibeBoxes } from '@/lib/vibebox/provisioning';
import { z } from 'zod';

/**
 * VibeBoxes API
 * GET /api/vibeboxes - List user's VibeBoxes
 * POST /api/vibeboxes - Create new VibeBox
 *
 * #vibebox #api #crud
 */

const createVibeBoxSchema = z.object({
    name: z.string().optional(),
    ipAddress: z.string().ip().optional(),
    sshPort: z.number().int().min(1).max(65535).optional(),
});

/**
 * GET /api/vibeboxes
 * Returns list of current user's VibeBoxes
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Get user's VibeBoxes
        const vibeBoxes = await getUserVibeBoxes(user.id);

        return successResponse({
            vibeBoxes,
            total: vibeBoxes.length,
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * POST /api/vibeboxes
 * Creates a new VibeBox for current user
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createVibeBoxSchema.parse(body);

        // Provision VibeBox
        const vibeBox = await provisionVibeBox({
            userId: user.id,
            name: validatedData.name,
            ipAddress: validatedData.ipAddress,
            sshPort: validatedData.sshPort,
        });

        return successResponse(
            {
                vibeBox,
                message: 'VibeBox provisioning started',
            },
            201
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw errors.badRequest('Invalid VibeBox data');
        }
        return errorResponse(error);
    }
}
