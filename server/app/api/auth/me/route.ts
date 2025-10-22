import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
    const authResult = await requireAuth(request);

    if (authResult instanceof NextResponse) {
        return authResult; // Error response
    }

    const { user } = authResult;

    // TODO: Fetch user from database
    // For now, return Logto user info
    return NextResponse.json({
        id: user.sub,
        email: user.email,
        name: user.name,
        picture: user.picture,
    });
}
