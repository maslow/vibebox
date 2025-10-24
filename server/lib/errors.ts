import { NextResponse } from 'next/server';

/**
 * Unified Error Response System
 * Provides consistent error responses across all API endpoints
 *
 * #api #errors #http
 */

export class ApiError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

export function errorResponse(error: unknown): NextResponse {
    console.error('API Error:', error);

    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
                code: error.code,
            },
            { status: error.statusCode }
        );
    }

    // Generic error
    return NextResponse.json(
        {
            success: false,
            error: 'Internal server error',
        },
        { status: 500 }
    );
}

export function successResponse<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(
        {
            success: true,
            data,
        },
        { status }
    );
}

// Common error constructors
export const errors = {
    unauthorized: (message = 'Unauthorized') =>
        new ApiError(401, message, 'UNAUTHORIZED'),

    forbidden: (message = 'Forbidden') =>
        new ApiError(403, message, 'FORBIDDEN'),

    notFound: (message = 'Resource not found') =>
        new ApiError(404, message, 'NOT_FOUND'),

    badRequest: (message = 'Bad request') =>
        new ApiError(400, message, 'BAD_REQUEST'),

    conflict: (message = 'Resource already exists') =>
        new ApiError(409, message, 'CONFLICT'),

    internal: (message = 'Internal server error') =>
        new ApiError(500, message, 'INTERNAL_ERROR'),
};
