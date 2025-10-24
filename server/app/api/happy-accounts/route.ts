import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { successResponse, errorResponse, errors } from '@/lib/errors';
import { prisma } from '@/lib/db';
import { createHappyAccount } from '@/lib/happy/auth';
import { happyClient } from '@/lib/happy/client';
import { encrypt } from '@/lib/encryption';

/**
 * Happy Accounts API
 * POST /api/happy-accounts - Create Happy account for current user
 * GET /api/happy-accounts - Get current user's Happy account
 *
 * #happy-account #api #integration
 */

/**
 * POST /api/happy-accounts
 * Creates a new Happy account for the current user
 * Automatically generates keypair and authenticates with Happy Server
 */
export async function POST(request: NextRequest) {
    try {
        const authResult = await requireAuth(request);

        if ('status' in authResult) {
            return authResult; // Error response from middleware
        }

        const { user } = authResult;

        // Check if user already has a Happy account
        const existingAccount = await prisma.happyAccount.findFirst({
            where: { userId: user.id },
        });

        if (existingAccount) {
            throw errors.conflict('User already has a Happy account');
        }

        // Generate Happy keypair and auth request
        const { credentials, authRequest } = createHappyAccount();

        // Authenticate with Happy Server
        console.log('[HAPPY] Authenticating with Happy Server...');
        const authResponse = await happyClient.authenticate(authRequest);

        // Update credentials with token
        credentials.token = authResponse.token;

        // Encrypt secret for storage
        const encryptedToken = encrypt(credentials.token);
        const encryptedSecret = encrypt(credentials.secret);

        // Store in database
        const happyAccount = await prisma.happyAccount.create({
            data: {
                userId: user.id,
                happyToken: encryptedToken,
                happySecret: encryptedSecret,
            },
        });

        console.log('[HAPPY] Happy account created for user:', user.id);

        return successResponse({
            id: happyAccount.id,
            userId: happyAccount.userId,
            createdAt: happyAccount.createdAt,
            message: 'Happy account created successfully',
        }, 201);
    } catch (error) {
        console.error('[HAPPY] Failed to create account:', error);
        return errorResponse(error);
    }
}

/**
 * GET /api/happy-accounts
 * Returns current user's Happy account information (without credentials)
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

        return successResponse({
            id: happyAccount.id,
            userId: happyAccount.userId,
            machineId: happyAccount.machineId,
            createdAt: happyAccount.createdAt,
            updatedAt: happyAccount.updatedAt,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
