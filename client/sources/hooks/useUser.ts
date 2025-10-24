import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import type { PlatformUser } from '../../../shared/types';

/**
 * Hook to manage user profile data
 * Integrates with VibeBox platform API
 *
 * #hooks #user #profile
 */

export function useUser() {
    const [user, setUser] = useState<PlatformUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUser = async () => {
        try {
            setLoading(true);
            setError(null);
            const userData = await apiClient.getProfile();
            setUser(userData);
        } catch (err) {
            setError(err as Error);
            console.error('[useUser] Failed to fetch user:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (updates: { name?: string; picture?: string }) => {
        try {
            const updatedUser = await apiClient.updateProfile(updates);
            setUser(updatedUser);
            return updatedUser;
        } catch (err) {
            setError(err as Error);
            console.error('[useUser] Failed to update user:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return {
        user,
        loading,
        error,
        refetch: fetchUser,
        updateUser,
    };
}
