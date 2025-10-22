import { NextRequest, NextResponse } from 'next/server';
import { verifyLogtoToken, extractBearerToken } from './logto';

export async function requireAuth(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    const token = extractBearerToken(authHeader);

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const user = await verifyLogtoToken(token);
        return { user };
    } catch (error) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
}
