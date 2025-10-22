import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useLogtoAuth } from '@/hooks/useLogtoAuth';
import { router } from 'expo-router';

export default function LoginScreen() {
    const { signIn, isLoading } = useLogtoAuth();
    const [signingIn, setSigningIn] = React.useState(false);

    const handleLogin = async () => {
        try {
            setSigningIn(true);
            await signIn();
            // Navigation handled by Logto callback
        } catch (error) {
            console.error('Login failed:', error);
            setSigningIn(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>VibeBox</Text>
            <Text style={styles.subtitle}>Mobile-first AI coding platform</Text>

            <Pressable
                style={[styles.button, (isLoading || signingIn) && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading || signingIn}
            >
                {isLoading || signingIn ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.buttonText}>Sign In with Logto</Text>
                )}
            </Pressable>

            <Text style={styles.footer}>
                Powered by Claude Code and Happy Server
            </Text>
        </View>
    );
}

const styles = StyleSheet.create((theme) => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: theme.colors.groupped.background,
    },
    title: {
        fontSize: 48,
        fontWeight: 'bold',
        marginBottom: 8,
        color: theme.colors.text,
    },
    subtitle: {
        fontSize: 18,
        marginBottom: 48,
        color: theme.colors.textSecondary,
        textAlign: 'center',
    },
    button: {
        backgroundColor: theme.colors.button.primary.background,
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 12,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: theme.colors.button.primary.tint,
        fontSize: 18,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 32,
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
}));
