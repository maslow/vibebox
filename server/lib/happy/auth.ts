import * as nacl from 'tweetnacl';
import { HappyAuthRequest, HappyAuthResponse, HappyCredentials } from './types';

/**
 * Happy Server Authentication Logic
 * Implements Ed25519 key generation and challenge-signature authentication
 * Based on Zero Modification Solution
 *
 * #happy #auth #ed25519 #zero-modification
 */

/**
 * Generate Ed25519 keypair for Happy authentication
 * Returns secret and public key in base64 encoding
 */
export function generateHappyKeypair(): {
    secret: string;
    publicKey: string;
    secretBytes: Uint8Array;
} {
    // Generate 32 random bytes for secret
    const secretBytes = nacl.randomBytes(32);

    // Create signing key from secret
    const signingKey = nacl.sign.keyPair.fromSeed(secretBytes);

    // Encode to base64url (compatible with Happy's format)
    const secret = Buffer.from(secretBytes).toString('base64url');
    const publicKey = Buffer.from(signingKey.publicKey).toString('base64');

    return {
        secret,
        publicKey,
        secretBytes,
    };
}

/**
 * Generate challenge and signature for Happy authentication
 */
export function generateChallengeSignature(secretBytes: Uint8Array): {
    challenge: string;
    signature: string;
} {
    // Generate 32 random bytes for challenge
    const challengeBytes = nacl.randomBytes(32);

    // Create signing key from secret
    const signingKey = nacl.sign.keyPair.fromSeed(secretBytes);

    // Sign the challenge
    const signedMessage = nacl.sign(challengeBytes, signingKey.secretKey);

    // Extract just the signature (first 64 bytes)
    const signatureBytes = signedMessage.slice(0, 64);

    // Encode to base64
    const challenge = Buffer.from(challengeBytes).toString('base64');
    const signature = Buffer.from(signatureBytes).toString('base64');

    return {
        challenge,
        signature,
    };
}

/**
 * Create authentication request for Happy Server /v1/auth
 */
export function createAuthRequest(
    secret: string,
    publicKey: string
): HappyAuthRequest {
    // Decode secret from base64url
    const secretBytes = Buffer.from(secret, 'base64url');

    // Generate challenge and signature
    const { challenge, signature } = generateChallengeSignature(secretBytes);

    return {
        publicKey,
        challenge,
        signature,
    };
}

/**
 * Complete Happy account creation flow
 * Generates keypair and creates auth request in one step
 */
export function createHappyAccount(): {
    credentials: HappyCredentials;
    authRequest: HappyAuthRequest;
} {
    // Generate keypair
    const { secret, publicKey, secretBytes } = generateHappyKeypair();

    // Generate challenge and signature
    const { challenge, signature } = generateChallengeSignature(secretBytes);

    return {
        credentials: {
            token: '', // Will be filled after API call
            secret,
        },
        authRequest: {
            publicKey,
            challenge,
            signature,
        },
    };
}
