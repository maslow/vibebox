import React, { useEffect, useRef, useState } from 'react';
import { useLogtoAuthContext } from '@/auth/LogtoAuthContext';
import { useAuth } from '@/auth/AuthContext';
import { apiClient } from '@/services/api';
import { View, Text, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { RoundButton } from '@/components/RoundButton';
import { t } from '@/text';

/**
 * Happy Auto-Login Component
 *
 * Automatically logs into Happy Server when Logto authentication succeeds.
 * This component monitors Logto auth state and:
 * 1. When user logs in via Logto, fetches Happy credentials from server
 * 2. Server auto-creates Happy account if user doesn't have one
 * 3. Stores Happy credentials locally and logs into Happy Server
 *
 * **CRITICAL REQUIREMENT:**
 * - Only when BOTH Logto AND Happy login succeed, user is considered logged in
 * - If Happy auto-login fails, user CANNOT enter the application
 * - Error screen is shown with retry option
 *
 * This ensures seamless dual authentication:
 * - Logto: VibeBox Platform access
 * - Happy: Development environment access
 *
 * #auth #happy #auto-login #dual-authentication #required
 */
export function HappyAutoLogin({ children }: { children: React.ReactNode }) {
    const logtoAuth = useLogtoAuthContext();
    const auth = useAuth();
    const hasProcessedRef = useRef(false);
    const [autoLoginStatus, setAutoLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const attemptAutoLogin = async () => {
        // Mark as processed to prevent duplicate runs
        hasProcessedRef.current = true;
        setAutoLoginStatus('loading');
        setErrorMessage('');

        // Small delay to ensure LogtoAuthContext has set the API token
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            console.log('[HappyAutoLogin] Fetching Happy credentials...');

            // Fetch or auto-create Happy account
            const credentials = await apiClient.getHappyAccountMe();

            console.log('[HappyAutoLogin] Happy credentials received, logging in...');

            // Log into Happy Server
            await auth.login(credentials.token, credentials.secret);

            console.log('[HappyAutoLogin] Successfully logged into Happy Server');
            setAutoLoginStatus('success');
        } catch (error) {
            console.error('[HappyAutoLogin] Failed to auto-login to Happy:', error);
            setErrorMessage(error instanceof Error ? error.message : 'Unknown error');
            setAutoLoginStatus('error');
            hasProcessedRef.current = false; // Allow retry
        }
    };

    useEffect(() => {
        // Only proceed if:
        // 1. Logto is authenticated
        // 2. Happy is NOT authenticated
        // 3. We haven't processed this already
        if (!logtoAuth.isAuthenticated || auth.isAuthenticated || hasProcessedRef.current) {
            return;
        }

        attemptAutoLogin();
    }, [logtoAuth.isAuthenticated, auth.isAuthenticated]);

    // Reset flag when Logto logs out
    useEffect(() => {
        if (!logtoAuth.isAuthenticated) {
            hasProcessedRef.current = false;
            setAutoLoginStatus('idle');
            setErrorMessage('');
        }
    }, [logtoAuth.isAuthenticated]);

    // If Logto not authenticated, render children (AuthGuard will handle it)
    if (!logtoAuth.isAuthenticated) {
        return <>{children}</>;
    }

    // If Happy already authenticated, render children
    if (auth.isAuthenticated) {
        return <>{children}</>;
    }

    // If auto-login in progress, show loading screen
    if (autoLoginStatus === 'loading') {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" />
                <Text style={styles.message}>{t('auth.connectingToHappy')}</Text>
            </View>
        );
    }

    // If auto-login failed, show error screen (BLOCK entry to app)
    if (autoLoginStatus === 'error') {
        return (
            <View style={styles.container}>
                <Text style={styles.errorTitle}>{t('auth.happyLoginFailed')}</Text>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
                <View style={styles.buttonContainer}>
                    <RoundButton
                        title={t('common.retry')}
                        action={() => attemptAutoLogin()}
                    />
                </View>
            </View>
        );
    }

    // Default: render children
    return <>{children}</>;
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.groupped.background,
        paddingHorizontal: 24,
    },
    message: {
        marginTop: 16,
        fontSize: 16,
        color: theme.colors.text,
    },
    errorTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 16,
        textAlign: 'center',
    },
    errorMessage: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 32,
        textAlign: 'center',
    },
    buttonContainer: {
        width: 200,
    },
}));
