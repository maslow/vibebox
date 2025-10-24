import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { createHappyAccount } from '@/lib/happy/auth';
import { happyClient } from '@/lib/happy/client';
import { encrypt, decrypt } from '@/lib/encryption';

/**
 * Happy Account Auto-Provisioning API
 * GET /api/happy-accounts/me - Get or auto-create Happy account with credentials
 *
 * This endpoint automatically creates a Happy account if the user doesn't have one,
 * and returns the decrypted credentials for client-side use.
 *
 * #happy-account #auto-provision #credentials
 */

export interface HappyAccountCredentials {
    token: string;
    secret: string;
    serverUrl: string;
}

/**
 * GET /api/happy-accounts/me
 * Returns current user's Happy account credentials
 * Auto-creates account if it doesn't exist
 */
export async function GET(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Check if user already has a Happy account
        let happyAccount = await prisma.happyAccount.findFirst({
            where: { userId: user.id },
        });

        // Auto-create Happy account if it doesn't exist
        if (!happyAccount) {
            console.log('[HAPPY] Auto-creating Happy account for user:', user.id);

            // Generate Happy keypair and auth request
            const { credentials, authRequest } = createHappyAccount();

            // Authenticate with Happy Server
            const authResponse = await happyClient.authenticate(authRequest);
            credentials.token = authResponse.token;

            // Encrypt and store credentials
            const encryptedToken = encrypt(credentials.token);
            const encryptedSecret = encrypt(credentials.secret);

            happyAccount = await prisma.happyAccount.create({
                data: {
                    userId: user.id,
                    happyToken: encryptedToken,
                    happySecret: encryptedSecret,
                },
            });

            console.log('[HAPPY] Happy account auto-created:', happyAccount.id);
        }

        // Decrypt credentials for client
        const token = decrypt(happyAccount.happyToken);
        const secret = decrypt(happyAccount.happySecret);

        const credentials: HappyAccountCredentials = {
            token,
            secret,
            serverUrl: process.env.HAPPY_SERVER_URL || 'https://api.happy.dev',
        };

        return successResponse(credentials);
    } catch (error) {
        console.error('[HAPPY] Failed to get/create account:', error);
        return errorResponse(error);
    }
}
