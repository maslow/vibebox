import React, { useEffect, useRef } from 'react';
import { useLogtoAuthContext } from '@/auth/LogtoAuthContext';
import { useAuth } from '@/auth/AuthContext';
import { apiClient } from '@/services/api';

/**
 * Happy Auto-Login Component
 *
 * Automatically logs into Happy Server when Logto authentication succeeds.
 * This component monitors Logto auth state and:
 * 1. When user logs in via Logto, fetches Happy credentials from server
 * 2. Server auto-creates Happy account if user doesn't have one
 * 3. Stores Happy credentials locally and logs into Happy Server
 *
 * This ensures seamless dual authentication:
 * - Logto: VibeBox Platform access
 * - Happy: Development environment access
 *
 * #auth #happy #auto-login #dual-authentication
 */
export function HappyAutoLogin({ children }: { children: React.ReactNode }) {
    const logtoAuth = useLogtoAuthContext();
    const auth = useAuth();
    const hasProcessedRef = useRef(false);

    useEffect(() => {
        const autoLoginHappy = async () => {
            // Only proceed if:
            // 1. Logto is authenticated
            // 2. Happy is NOT authenticated
            // 3. We haven't processed this already
            if (!logtoAuth.isAuthenticated || auth.isAuthenticated || hasProcessedRef.current) {
                return;
            }

            // Mark as processed to prevent duplicate runs
            hasProcessedRef.current = true;

            // Small delay to ensure LogtoAuthContext has set the API token
            // This avoids race condition where API call happens before token is set
            await new Promise(resolve => setTimeout(resolve, 100));

            try {
                console.log('[HappyAutoLogin] Fetching Happy credentials...');

                // Fetch or auto-create Happy account
                const credentials = await apiClient.getHappyAccountMe();

                console.log('[HappyAutoLogin] Happy credentials received, logging in...');

                // Log into Happy Server
                await auth.login(credentials.token, credentials.secret);

                console.log('[HappyAutoLogin] Successfully logged into Happy Server');
            } catch (error) {
                console.error('[HappyAutoLogin] Failed to auto-login to Happy:', error);
                // Reset flag to allow retry
                hasProcessedRef.current = false;
            }
        };

        autoLoginHappy();
    }, [logtoAuth.isAuthenticated, auth.isAuthenticated]);

    // Reset flag when Logto logs out
    useEffect(() => {
        if (!logtoAuth.isAuthenticated) {
            hasProcessedRef.current = false;
        }
    }, [logtoAuth.isAuthenticated]);

    return <>{children}</>;
}
