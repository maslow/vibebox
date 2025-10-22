import { Platform } from 'react-native';

// Platform-specific imports
// Web: Use @logto/react for redirect-based authentication
// Native: Use @logto/rn for native browser authentication
const useLogtoSDK = Platform.OS === 'web'
    ? require('@logto/react').useLogto
    : require('@logto/rn').useLogto;

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
    const logtoHook = useLogtoSDK();

    // Extract common properties
    const {
        isAuthenticated,
        signIn: logtoSignIn,
        signOut: logtoSignOut,
        getAccessToken,
        getIdTokenClaims,
    } = logtoHook;

    // Handle platform-specific loading states
    // @logto/react uses 'isLoading'
    // @logto/rn uses 'isInitialized' (inverted)
    const isLoading = Platform.OS === 'web'
        ? ((logtoHook as any).isLoading ?? false)
        : !((logtoHook as any).isInitialized ?? false);

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
