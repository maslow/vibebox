import { createRemoteJWKSet, jwtVerify } from 'jose';

const JWKS_URI = process.env.LOGTO_JWKS_URI || 'http://localhost:3001/oidc/jwks';
const JWKS = createRemoteJWKSet(new URL(JWKS_URI));

export interface LogtoUser {
    sub: string; // User ID
    username?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
}

export async function verifyLogtoToken(token: string): Promise<LogtoUser> {
    try {
        // First decode to see what's in the token
        const parts = token.split('.');
        if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            console.log('[LOGTO] Token payload iss:', payload.iss);
            console.log('[LOGTO] Token payload aud:', payload.aud);
            console.log('[LOGTO] Expected iss:', process.env.LOGTO_ENDPOINT);
            console.log('[LOGTO] Expected aud:', process.env.LOGTO_APP_ID);
        }

        const { payload } = await jwtVerify(token, JWKS, {
            issuer: process.env.LOGTO_ENDPOINT,
            audience: process.env.LOGTO_APP_ID,
        });

        return payload as LogtoUser;
    } catch (error) {
        console.error('[LOGTO] Token verification error:', error);
        console.error('[LOGTO] JWKS_URI:', JWKS_URI);
        console.error('[LOGTO] Issuer:', process.env.LOGTO_ENDPOINT);
        console.error('[LOGTO] Audience:', process.env.LOGTO_APP_ID);
        throw error;
    }
}

export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
