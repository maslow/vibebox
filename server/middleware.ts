import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Global Middleware for CORS and request handling
 *
 * Handles:
 * - CORS headers for cross-origin requests
 * - Preflight OPTIONS requests
 *
 * #middleware #cors #api
 */

export function middleware(request: NextRequest) {
    // Allow all origins in development
    const origin = request.headers.get('origin') || '*';

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': origin,
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Max-Age': '86400',
            },
        });
    }

    // Add CORS headers to all responses
    const response = NextResponse.next();

    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
}

// Configure which routes the middleware runs on
export const config = {
    matcher: '/api/:path*', // Apply to all API routes
};
