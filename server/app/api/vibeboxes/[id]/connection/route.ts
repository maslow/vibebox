import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { getVibeBox } from '@/lib/vibebox/provisioning';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';

/**
 * VibeBox Connection Info API
 * GET /api/vibeboxes/[id]/connection - Get connection credentials
 *
 * Returns SSH and Happy Server connection information
 * This is used by the client to connect to the VibeBox
 *
 * #vibebox #connection #credentials
 */

/**
 * GET /api/vibeboxes/[id]/connection
 * Returns connection information for VibeBox
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

        // Get Happy Account credentials
        const happyAccount = await prisma.happyAccount.findFirst({
            where: { userId: user.id },
        });

        if (!happyAccount) {
            throw errors.notFound('Happy account not found');
        }

        // Decrypt credentials
        const happyToken = decrypt(happyAccount.happyToken);
        const happySecret = decrypt(happyAccount.happySecret);

        // Return connection info
        return successResponse({
            vibeBoxId: vibeBox.id,
            ipAddress: vibeBox.ipAddress,
            sshPort: vibeBox.sshPort,
            sshCommand: vibeBox.ipAddress
                ? `ssh root@${vibeBox.ipAddress} -p ${vibeBox.sshPort}`
                : null,
            happy: {
                token: happyToken,
                secret: happySecret,
                serverUrl: process.env.HAPPY_SERVER_URL || 'https://api.happy.dev',
            },
        });
    } catch (error) {
        return errorResponse(error);
    }
}
