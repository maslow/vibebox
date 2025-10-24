import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLogtoAuth } from '@/hooks/useLogtoAuth';
import { apiClient } from '@/services/api';

/**
 * Logto Authentication Context
 * Integrates Logto authentication with VibeBox Platform API
 *
 * This context wraps the useLogtoAuth hook and automatically
 * sets the auth token for the API client when user logs in
 *
 * #auth #logto #context
 */

interface LogtoAuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    signIn: () => Promise<void>;
    signOut: () => Promise<void>;
    getAccessToken: () => Promise<string | undefined>;
}

const LogtoAuthContext = createContext<LogtoAuthContextType | undefined>(undefined);

export function LogtoAuthProvider({ children }: { children: ReactNode }) {
    const logtoAuth = useLogtoAuth();

    // Update API client token when authentication state changes
    useEffect(() => {
        const updateApiToken = async () => {
            if (logtoAuth.isAuthenticated) {
                try {
                    // For Logto, we need to use ID token for backend verification
                    // Access token is for calling APIs with resource parameter
                    const claims = await logtoAuth.getIdTokenClaims();

                    // Get the raw ID token from localStorage (it's stored by Logto SDK)
                    const appId = process.env.EXPO_PUBLIC_LOGTO_APP_ID || 'ctwsvtkhp7e0yn5nm6s93';
                    const idTokenKey = `logto:${appId}:idToken`;
                    const idToken = typeof window !== 'undefined'
                        ? window.localStorage.getItem(idTokenKey)
                        : null;

                    if (idToken) {
                        console.log('[LogtoAuth] ID token (first 50 chars):', idToken.substring(0, 50));
                        apiClient.setAuthToken(idToken);
                        console.log('[LogtoAuth] API token set');
                    } else {
                        console.error('[LogtoAuth] ID token not found in localStorage');
                        console.error('[LogtoAuth] Available keys:', Object.keys(window.localStorage));
                    }
                } catch (error) {
                    console.error('[LogtoAuth] Failed to get ID token:', error);
                }
            } else {
                apiClient.clearAuthToken();
                console.log('[LogtoAuth] API token cleared');
            }
        };

        updateApiToken();
    }, [logtoAuth.isAuthenticated]);

    return (
        <LogtoAuthContext.Provider value={logtoAuth}>
            {children}
        </LogtoAuthContext.Provider>
    );
}

export function useLogtoAuthContext() {
    const context = useContext(LogtoAuthContext);
    if (context === undefined) {
        throw new Error('useLogtoAuthContext must be used within a LogtoAuthProvider');
    }
    return context;
}
