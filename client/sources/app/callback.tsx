import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

/**
 * OAuth callback handler for web platform
 *
 * This route handles the redirect from Logto after authentication.
 * The Logto SDK automatically processes the callback URL parameters.
 */
export default function CallbackScreen() {
    const router = useRouter();

    useEffect(() => {
        // Give the Logto SDK time to process the callback
        const timer = setTimeout(() => {
            // After processing, redirect to home
            router.replace('/(app)');
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

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
