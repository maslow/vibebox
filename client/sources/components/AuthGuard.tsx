import React from 'react';
import { useLogtoAuth } from '@/hooks/useLogtoAuth';
import { View, ActivityIndicator } from 'react-native';
import LoginScreen from '@/app/(auth)/login';
import { StyleSheet } from 'react-native-unistyles';

/**
 * Authentication Guard Component
 *
 * Checks Logto authentication status and renders:
 * - Loading screen while checking auth
 * - Login screen if not authenticated
 * - Children (main app) if authenticated
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, isLoading } = useLogtoAuth();

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
