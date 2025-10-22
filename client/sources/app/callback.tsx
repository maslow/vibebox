import React from 'react';
import { View, Text, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

/**
 * OAuth callback handler
 *
 * For web: Uses @logto/react's useHandleSignInCallback
 * For native: Uses @logto/rn's automatic callback handling
 */

// Import hooks conditionally based on platform
const useCallbackHandler = Platform.OS === 'web'
    ? require('@logto/react').useHandleSignInCallback
    : () => ({ isLoading: false, isAuthenticated: false });

export default function CallbackScreen() {
    const router = useRouter();

    // Use the callback handler
    const { isLoading, isAuthenticated } = useCallbackHandler(() => {
        console.log('✅ Sign-in callback completed!');
        // Redirect to app after callback is processed
        setTimeout(() => {
            console.log('Redirecting to app...');
            router.replace('/');
        }, 100);
    });

    console.log(`Callback state: isLoading=${isLoading}, isAuthenticated=${isAuthenticated}`);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={styles.text}>Completing sign in...</Text>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.groupped.background,
        gap: 16,
    },
    text: {
        color: theme.colors.text,
        fontSize: 16,
    },
}));
