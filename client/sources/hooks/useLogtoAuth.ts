import { useLogto } from '@logto/rn';
import { Platform } from 'react-native';

// Platform-specific redirect URIs
const getRedirectUri = () => {
    if (Platform.OS === 'web') {
        // For web, use current origin + /callback
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/callback`;
        }
        return 'http://localhost:8081/callback';
    }
    // For native platforms, use custom scheme
    return 'io.vibebox://callback';
};

const REDIRECT_URI = getRedirectUri();

export function useLogtoAuth() {
    const {
        isAuthenticated,
        isLoading,
        signIn: logtoSignIn,
        signOut: logtoSignOut,
        getAccessToken,
        getIdTokenClaims,
    } = useLogto();

    const signIn = async () => {
        try {
            await logtoSignIn(REDIRECT_URI);
        } catch (error) {
            console.error('Sign in error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await logtoSignOut(REDIRECT_URI);
        } catch (error) {
            console.error('Sign out error:', error);
            throw error;
        }
    };

    return {
        isAuthenticated,
        isLoading,
        signIn,
        signOut,
        getAccessToken,
        getIdTokenClaims,
    };
}
