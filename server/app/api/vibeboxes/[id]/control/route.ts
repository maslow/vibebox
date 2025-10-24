import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { getVibeBox, activateVibeBox, deactivateVibeBox } from '@/lib/vibebox/provisioning';
import { z } from 'zod';

/**
 * VibeBox Control API
 * POST /api/vibeboxes/[id]/control - Control VibeBox (start/stop/restart)
 *
 * Manages VibeBox lifecycle operations
 *
 * #vibebox #control #lifecycle
 */

const controlVibeBoxSchema = z.object({
    action: z.enum(['start', 'stop', 'restart']),
});

/**
 * POST /api/vibeboxes/[id]/control
 * Control VibeBox operations
 */
export async function POST(
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
        const { action } = controlVibeBoxSchema.parse(body);

        let updatedVibeBox;
        let message;

        switch (action) {
            case 'start':
                updatedVibeBox = await activateVibeBox(vibeBoxId);
                message = 'VibeBox started successfully';
                // TODO: In production, trigger async task to start server
                break;

            case 'stop':
                updatedVibeBox = await deactivateVibeBox(vibeBoxId);
                message = 'VibeBox stopped successfully';
                // TODO: In production, trigger async task to stop server
                break;

            case 'restart':
                // Restart is stop + start
                await deactivateVibeBox(vibeBoxId);
                updatedVibeBox = await activateVibeBox(vibeBoxId);
                message = 'VibeBox restarted successfully';
                // TODO: In production, trigger async task to restart server
                break;

            default:
                throw errors.badRequest('Invalid action');
        }

        return successResponse({
            vibeBox: updatedVibeBox,
            message,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw errors.badRequest('Invalid control action');
        }
        return errorResponse(error);
    }
}
