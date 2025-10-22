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
        const { payload } = await jwtVerify(token, JWKS, {
            issuer: process.env.LOGTO_ENDPOINT,
            audience: process.env.LOGTO_APP_ID,
        });

        return payload as LogtoUser;
    } catch (error) {
        throw new Error('Invalid token');
    }
}

export function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}
