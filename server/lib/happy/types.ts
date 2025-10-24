/**
 * Happy Server Integration Types
 * Based on Zero Modification Solution
 *
 * #happy #types #integration
 */

/**
 * Happy Server authentication request
 */
export interface HappyAuthRequest {
    publicKey: string; // Base64 encoded public key
    challenge: string; // Base64 encoded challenge
    signature: string; // Base64 encoded signature
}

/**
 * Happy Server authentication response
 */
export interface HappyAuthResponse {
    success: boolean;
    token: string;
}

/**
 * Happy credentials for storage
 */
export interface HappyCredentials {
    token: string;
    secret: string; // Base64 encoded secret
}

/**
 * Happy access key file format
 * Written to ~/.happy/access.key on VibeBox servers
 */
export interface HappyAccessKey {
    secret: string; // Base64 encoded
    token: string; // JWT token
}

/**
 * Machine registration request/response
 */
export interface HappyMachine {
    id: string;
    name: string;
    accountId: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
