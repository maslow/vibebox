import React from 'react';
import { useLogtoAuth } from '@/hooks/useLogtoAuth';
import { View, ActivityIndicator, Platform } from 'react-native';
import LoginScreen from '@/app/(auth)/login';
import { StyleSheet } from 'react-native-unistyles';
import { usePathname } from 'expo-router';

/**
 * Authentication Guard Component
 *
 * Checks Logto authentication status and renders:
 * - Loading screen while checking auth
 * - Login screen if not authenticated
 * - Children (main app) if authenticated
 *
 * Special handling for OAuth callback route:
 * - Allows /callback route to bypass auth check on web platform
 * - This lets Logto SDK process the OAuth redirect before auth check
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useLogtoAuth();
    const pathname = usePathname();

    // Allow callback route to bypass auth check (needed for OAuth redirect flow)
    if (Platform.OS === 'web' && pathname === '/callback') {
        return <>{children}</>;
    }

    // Show loading indicator while checking auth status
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#fff" />
            </View>
        );
    }

    // Show login screen if not authenticated
    if (!isAuthenticated) {
        return <LoginScreen />;
    }

    // User is authenticated, show main app
    return <>{children}</>;
}

const styles = StyleSheet.create((theme) => ({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.groupped.background,
    },
}));
