import axios, { AxiosInstance } from 'axios';
import type { PlatformUser, VibeBox, VibeBoxConnectionInfo, ApiResponse, VibeBoxControlAction } from '../../../shared/types';

/**
 * VibeBox Platform API Client
 * Provides methods to interact with VibeBox backend
 *
 * #api #client #vibebox
 */

class ApiClient {
    private client: AxiosInstance;
    private baseURL: string;

    constructor() {
        this.baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

        this.client = axios.create({
            baseURL: this.baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Set authentication token for API requests
     */
    setAuthToken(token: string) {
        console.log('[ApiClient] setAuthToken called with token (first 50):', token.substring(0, 50));
        this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[ApiClient] Authorization header set:', this.client.defaults.headers.common['Authorization']?.substring(0, 60));
    }

    /**
     * Clear authentication token
     */
    clearAuthToken() {
        delete this.client.defaults.headers.common['Authorization'];
    }

    // User APIs
    async getMe(): Promise<PlatformUser> {
        const { data } = await this.client.get<ApiResponse<PlatformUser>>('/api/auth/me');
        return data.data!;
    }

    async getProfile(): Promise<PlatformUser> {
        const { data } = await this.client.get<ApiResponse<PlatformUser>>('/api/users/profile');
        return data.data!;
    }

    async updateProfile(updates: { name?: string; picture?: string }): Promise<PlatformUser> {
        const { data } = await this.client.put<ApiResponse<PlatformUser>>('/api/users/profile', updates);
        return data.data!;
    }

    // VibeBox APIs
    async getVibeBoxes(): Promise<{ vibeBoxes: VibeBox[]; total: number }> {
        const { data } = await this.client.get<ApiResponse<{ vibeBoxes: VibeBox[]; total: number }>>('/api/vibeboxes');
        return data.data!;
    }

    async getVibeBox(id: string): Promise<VibeBox> {
        const { data } = await this.client.get<ApiResponse<VibeBox>>(`/api/vibeboxes/${id}`);
        return data.data!;
    }

    async createVibeBox(params: { name?: string }): Promise<VibeBox> {
        const { data } = await this.client.post<ApiResponse<{ vibeBox: VibeBox }>>('/api/vibeboxes', params);
        return data.data!.vibeBox;
    }

    async updateVibeBox(id: string, updates: { name?: string }): Promise<VibeBox> {
        const { data } = await this.client.put<ApiResponse<VibeBox>>(`/api/vibeboxes/${id}`, updates);
        return data.data!;
    }

    async deleteVibeBox(id: string): Promise<void> {
        await this.client.delete(`/api/vibeboxes/${id}`);
    }

    async getVibeBoxConnection(id: string): Promise<VibeBoxConnectionInfo> {
        const { data } = await this.client.get<ApiResponse<VibeBoxConnectionInfo>>(`/api/vibeboxes/${id}/connection`);
        return data.data!;
    }

    async controlVibeBox(id: string, action: VibeBoxControlAction): Promise<VibeBox> {
        const { data } = await this.client.post<ApiResponse<{ vibeBox: VibeBox }>>(`/api/vibeboxes/${id}/control`, { action });
        return data.data!.vibeBox;
    }

    // Happy Account APIs
    async createHappyAccount(): Promise<{ id: string; userId: string }> {
        const { data } = await this.client.post<ApiResponse<{ id: string; userId: string }>>('/api/happy-accounts');
        return data.data!;
    }

    async getHappyAccount(): Promise<{ id: string; userId: string; machineId?: string }> {
        const { data } = await this.client.get<ApiResponse<{ id: string; userId: string; machineId?: string }>>('/api/happy-accounts');
        return data.data!;
    }

    async getHappyConnection(): Promise<{ token: string; secret: string; machineId?: string }> {
        const { data } = await this.client.get<ApiResponse<{ token: string; secret: string; machineId?: string }>>('/api/happy-accounts/connection');
        return data.data!;
    }

    async getHappyAccountMe(): Promise<{ token: string; secret: string; serverUrl: string }> {
        const { data } = await this.client.get<ApiResponse<{ token: string; secret: string; serverUrl: string }>>('/api/happy-accounts/me');
        return data.data!;
    }
}

export const apiClient = new ApiClient();
