import axios, { AxiosInstance } from 'axios';
import { HappyAuthRequest, HappyAuthResponse, HappyMachine } from './types';

/**
 * Happy Server API Client
 * Provides methods to interact with Happy Server's official API
 * Uses zero-modification approach - only public APIs
 *
 * #happy #api #client #zero-modification
 */

export class HappyClient {
    private client: AxiosInstance;
    private serverUrl: string;

    constructor(serverUrl?: string) {
        this.serverUrl = serverUrl || process.env.HAPPY_SERVER_URL || 'https://api.happy.dev';

        this.client = axios.create({
            baseURL: this.serverUrl,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    /**
     * Authenticate with Happy Server using challenge-signature
     * This endpoint automatically creates account if it doesn't exist
     *
     * @param authRequest Challenge-signature authentication request
     * @returns Happy auth response with token
     */
    async authenticate(authRequest: HappyAuthRequest): Promise<HappyAuthResponse> {
        try {
            const response = await this.client.post<HappyAuthResponse>(
                '/v1/auth',
                authRequest
            );

            if (!response.data.success) {
                throw new Error('Authentication failed: ' + JSON.stringify(response.data));
            }

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.message;
                throw new Error(`Happy authentication failed: ${message}`);
            }
            throw error;
        }
    }

    /**
     * Get machine info by ID
     * Requires authentication token
     *
     * @param token Happy authentication token
     * @param machineId Machine ID
     * @returns Machine information
     */
    async getMachine(token: string, machineId: string): Promise<HappyMachine> {
        try {
            const response = await this.client.get<{ machine: HappyMachine }>(
                `/v1/machines/${machineId}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.machine;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.message;
                throw new Error(`Failed to get machine: ${message}`);
            }
            throw error;
        }
    }

    /**
     * List all machines for authenticated user
     * Requires authentication token
     *
     * @param token Happy authentication token
     * @returns List of machines
     */
    async listMachines(token: string): Promise<HappyMachine[]> {
        try {
            const response = await this.client.get<{ machines: HappyMachine[] }>(
                '/v1/machines',
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            return response.data.machines;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const message = error.response?.data?.error || error.message;
                throw new Error(`Failed to list machines: ${message}`);
            }
            throw error;
        }
    }

    /**
     * Health check
     * @returns true if server is healthy
     */
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.client.get('/health');
            return response.status === 200;
        } catch (error) {
            return false;
        }
    }
}

// Export singleton instance
export const happyClient = new HappyClient();
