import { useState, useEffect } from 'react';
import { apiClient } from '@/services/api';
import type { VibeBox, VibeBoxControlAction, VibeBoxConnectionInfo } from '../../../shared/types';

/**
 * Hook to manage VibeBox data and operations
 * Provides CRUD and control operations for VibeBoxes
 *
 * #hooks #vibebox #management
 */

export function useVibeBoxes() {
    const [vibeBoxes, setVibeBoxes] = useState<VibeBox[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchVibeBoxes = async () => {
        try {
            setLoading(true);
            setError(null);
            const { vibeBoxes: data } = await apiClient.getVibeBoxes();
            setVibeBoxes(data);
        } catch (err) {
            setError(err as Error);
            console.error('[useVibeBoxes] Failed to fetch VibeBoxes:', err);
        } finally {
            setLoading(false);
        }
    };

    const createVibeBox = async (params?: { name?: string }) => {
        try {
            const newVibeBox = await apiClient.createVibeBox(params || {});
            setVibeBoxes(prev => [...prev, newVibeBox]);
            return newVibeBox;
        } catch (err) {
            console.error('[useVibeBoxes] Failed to create VibeBox:', err);
            throw err;
        }
    };

    const updateVibeBox = async (id: string, updates: { name?: string }) => {
        try {
            const updatedVibeBox = await apiClient.updateVibeBox(id, updates);
            setVibeBoxes(prev => prev.map(vb => vb.id === id ? updatedVibeBox : vb));
            return updatedVibeBox;
        } catch (err) {
            console.error('[useVibeBoxes] Failed to update VibeBox:', err);
            throw err;
        }
    };

    const deleteVibeBox = async (id: string) => {
        try {
            await apiClient.deleteVibeBox(id);
            setVibeBoxes(prev => prev.filter(vb => vb.id !== id));
        } catch (err) {
            console.error('[useVibeBoxes] Failed to delete VibeBox:', err);
            throw err;
        }
    };

    const controlVibeBox = async (id: string, action: VibeBoxControlAction) => {
        try {
            const updatedVibeBox = await apiClient.controlVibeBox(id, action);
            setVibeBoxes(prev => prev.map(vb => vb.id === id ? updatedVibeBox : vb));
            return updatedVibeBox;
        } catch (err) {
            console.error('[useVibeBoxes] Failed to control VibeBox:', err);
            throw err;
        }
    };

    const getConnection = async (id: string): Promise<VibeBoxConnectionInfo> => {
        try {
            return await apiClient.getVibeBoxConnection(id);
        } catch (err) {
            console.error('[useVibeBoxes] Failed to get connection info:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchVibeBoxes();
    }, []);

    return {
        vibeBoxes,
        loading,
        error,
        refetch: fetchVibeBoxes,
        createVibeBox,
        updateVibeBox,
        deleteVibeBox,
        controlVibeBox,
        getConnection,
    };
}

/**
 * Hook to manage a single VibeBox
 */
export function useVibeBox(id: string) {
    const [vibeBox, setVibeBox] = useState<VibeBox | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchVibeBox = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiClient.getVibeBox(id);
            setVibeBox(data);
        } catch (err) {
            setError(err as Error);
            console.error('[useVibeBox] Failed to fetch VibeBox:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateVibeBox = async (updates: { name?: string }) => {
        try {
            const updatedVibeBox = await apiClient.updateVibeBox(id, updates);
            setVibeBox(updatedVibeBox);
            return updatedVibeBox;
        } catch (err) {
            console.error('[useVibeBox] Failed to update VibeBox:', err);
            throw err;
        }
    };

    const controlVibeBox = async (action: VibeBoxControlAction) => {
        try {
            const updatedVibeBox = await apiClient.controlVibeBox(id, action);
            setVibeBox(updatedVibeBox);
            return updatedVibeBox;
        } catch (err) {
            console.error('[useVibeBox] Failed to control VibeBox:', err);
            throw err;
        }
    };

    const getConnection = async (): Promise<VibeBoxConnectionInfo> => {
        try {
            return await apiClient.getVibeBoxConnection(id);
        } catch (err) {
            console.error('[useVibeBox] Failed to get connection info:', err);
            throw err;
        }
    };

    useEffect(() => {
        if (id) {
            fetchVibeBox();
        }
    }, [id]);

    return {
        vibeBox,
        loading,
        error,
        refetch: fetchVibeBox,
        updateVibeBox,
        controlVibeBox,
        getConnection,
    };
}
