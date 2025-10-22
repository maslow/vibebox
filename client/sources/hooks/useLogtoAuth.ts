import { useLogto } from '@logto/rn';

const REDIRECT_URI = 'io.vibebox://callback';

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
