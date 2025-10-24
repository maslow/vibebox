import { VibeBoxStatus } from '@prisma/client';
import { prisma } from '@/lib/db';
import { createHappyAccount } from '@/lib/happy/auth';
import { happyClient } from '@/lib/happy/client';
import { encrypt } from '@/lib/encryption';

/**
 * VibeBox Provisioning Service
 * Handles VibeBox lifecycle management and configuration
 *
 * #vibebox #provisioning #lifecycle
 */

export interface ProvisionVibeBoxParams {
    userId: string;
    name?: string;
    ipAddress?: string;
    sshPort?: number;
}

export interface VibeBoxInfo {
    id: string;
    userId: string;
    name: string | null;
    status: VibeBoxStatus;
    ipAddress: string | null;
    sshPort: number | null;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Provision a new VibeBox for a user
 * Creates both VibeBox record and associated Happy Account
 */
export async function provisionVibeBox(
    params: ProvisionVibeBoxParams
): Promise<VibeBoxInfo> {
    const { userId, name, ipAddress, sshPort } = params;

    // Check if user already has a VibeBox
    const existingVibeBox = await prisma.vibeBox.findFirst({
        where: { userId },
    });

    if (existingVibeBox) {
        throw new Error('User already has a VibeBox');
    }

    // Check if user already has a Happy Account
    let happyAccount = await prisma.happyAccount.findFirst({
        where: { userId },
    });

    // Create Happy Account if it doesn't exist
    if (!happyAccount) {
        console.log('[VIBEBOX] Creating Happy account for user:', userId);

        const { credentials, authRequest } = createHappyAccount();

        // Authenticate with Happy Server
        const authResponse = await happyClient.authenticate(authRequest);
        credentials.token = authResponse.token;

        // Encrypt and store credentials
        const encryptedToken = encrypt(credentials.token);
        const encryptedSecret = encrypt(credentials.secret);

        happyAccount = await prisma.happyAccount.create({
            data: {
                userId,
                happyToken: encryptedToken,
                happySecret: encryptedSecret,
            },
        });

        console.log('[VIBEBOX] Happy account created:', happyAccount.id);
    }

    // Create VibeBox record
    const vibeBox = await prisma.vibeBox.create({
        data: {
            userId,
            name: name || `VibeBox-${Date.now()}`,
            status: VibeBoxStatus.PROVISIONING,
            ipAddress,
            sshPort: sshPort || 22,
        },
    });

    console.log('[VIBEBOX] VibeBox created:', vibeBox.id);

    // TODO: In production, trigger async task to:
    // 1. Allocate server from resource pool
    // 2. SSH to server and configure Happy CLI
    // 3. Write ~/.happy/access.key with credentials
    // 4. Start happy daemon
    // 5. Update VibeBox status to ACTIVE

    return vibeBox;
}

/**
 * Update VibeBox status
 */
export async function updateVibeBoxStatus(
    vibeBoxId: string,
    status: VibeBoxStatus
): Promise<VibeBoxInfo> {
    const vibeBox = await prisma.vibeBox.update({
        where: { id: vibeBoxId },
        data: { status },
    });

    console.log('[VIBEBOX] Status updated:', vibeBoxId, status);

    return vibeBox;
}

/**
 * Get VibeBox by ID
 */
export async function getVibeBox(vibeBoxId: string): Promise<VibeBoxInfo | null> {
    return await prisma.vibeBox.findUnique({
        where: { id: vibeBoxId },
    });
}

/**
 * Get user's VibeBoxes
 */
export async function getUserVibeBoxes(userId: string): Promise<VibeBoxInfo[]> {
    return await prisma.vibeBox.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
    });
}

/**
 * Delete VibeBox
 * Also cleans up associated Happy Account if no other VibeBoxes exist
 */
export async function deleteVibeBox(vibeBoxId: string): Promise<void> {
    const vibeBox = await prisma.vibeBox.findUnique({
        where: { id: vibeBoxId },
    });

    if (!vibeBox) {
        throw new Error('VibeBox not found');
    }

    // Delete VibeBox
    await prisma.vibeBox.delete({
        where: { id: vibeBoxId },
    });

    console.log('[VIBEBOX] VibeBox deleted:', vibeBoxId);

    // Check if user has other VibeBoxes
    const userVibeBoxes = await prisma.vibeBox.findMany({
        where: { userId: vibeBox.userId },
    });

    // If no other VibeBoxes, optionally delete Happy Account
    // (commented out for now - we might want to keep Happy Account)
    /*
    if (userVibeBoxes.length === 0) {
        await prisma.happyAccount.deleteMany({
            where: { userId: vibeBox.userId },
        });
        console.log('[VIBEBOX] Happy account deleted for user:', vibeBox.userId);
    }
    */
}

/**
 * Activate VibeBox
 * Transitions from PROVISIONING to ACTIVE
 */
export async function activateVibeBox(vibeBoxId: string): Promise<VibeBoxInfo> {
    return await updateVibeBoxStatus(vibeBoxId, VibeBoxStatus.ACTIVE);
}

/**
 * Deactivate VibeBox
 * Transitions to INACTIVE
 */
export async function deactivateVibeBox(vibeBoxId: string): Promise<VibeBoxInfo> {
    return await updateVibeBoxStatus(vibeBoxId, VibeBoxStatus.INACTIVE);
}

/**
 * Mark VibeBox as error state
 */
export async function markVibeBoxError(vibeBoxId: string): Promise<VibeBoxInfo> {
    return await updateVibeBoxStatus(vibeBoxId, VibeBoxStatus.ERROR);
}
