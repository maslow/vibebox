/**
 * China Mobile Cloud API Client
 * Handles all HTTP requests to China Mobile Cloud ECS API
 *
 * #chinamobile #api #client #ecs
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import { generateAuthHeaders } from './auth';
import {
  ChinaMobileResponse,
  CreateInstanceRequest,
  CreateInstanceResponse,
  InstanceDetails,
  BatchInstancesRequest,
  BatchOperationResponse,
  DeleteInstancesRequest,
} from './types';

/**
 * China Mobile Cloud API Client Configuration
 */
export interface ChinaMobileClientConfig {
  accessKeyId: string;
  accessKeySecret: string;
  endpoint?: string;
  timeout?: number;
}

/**
 * China Mobile Cloud API Error
 */
export class ChinaMobileAPIError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ChinaMobileAPIError';
  }
}

/**
 * China Mobile Cloud API Client
 */
export class ChinaMobileClient {
  private client: AxiosInstance;
  private accessKeyId: string;
  private accessKeySecret: string;
  private baseURL: string;

  constructor(config: ChinaMobileClientConfig) {
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.baseURL =
      config.endpoint || 'https://ecloud.10086.cn';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.client.interceptors.request.use((config) => {
      const authHeaders = generateAuthHeaders(
        this.accessKeyId,
        this.accessKeySecret,
        config.method?.toUpperCase() || 'GET',
        config.url || '',
        config.data
      );

      // For GET requests, use query parameters
      // For POST requests, use headers
      if (config.method?.toUpperCase() === 'GET') {
        // Add auth params to query string
        const params = new URLSearchParams(config.params || {});
        Object.entries(authHeaders).forEach(([key, value]) => {
          params.append(key, value);
        });
        config.params = params;
      } else {
        // Apply auth headers to request
        Object.entries(authHeaders).forEach(([key, value]) => {
          config.headers.set(key, value);
        });
      }

      return config;
    });
  }

  /**
   * Make API request with error handling
   */
  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    data?: any
  ): Promise<T> {
    try {
      const response = await this.client.request<ChinaMobileResponse<T>>({
        method,
        url: path,
        data,
      });

      // Check response state
      if (response.data.state !== 'OK') {
        throw new ChinaMobileAPIError(
          response.data.errorMessage || 'API request failed',
          response.data.errorCode || 'UNKNOWN_ERROR',
          response.data.requestId
        );
      }

      // Return body
      return response.data.body as T;
    } catch (error) {
      if (error instanceof ChinaMobileAPIError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ChinaMobileResponse>;

        if (axiosError.response?.data) {
          const { errorCode, errorMessage, requestId } = axiosError.response.data;
          throw new ChinaMobileAPIError(
            errorMessage || axiosError.message,
            errorCode || 'HTTP_ERROR',
            requestId
          );
        }

        throw new ChinaMobileAPIError(
          axiosError.message,
          axiosError.code || 'NETWORK_ERROR'
        );
      }

      throw error;
    }
  }

  /**
   * Create instances
   */
  async createInstances(
    params: CreateInstanceRequest
  ): Promise<CreateInstanceResponse> {
    return this.request<CreateInstanceResponse>(
      'POST',
      '/api/openapi-instance/v4/create-instances',
      params
    );
  }

  /**
   * Delete instances
   */
  async deleteInstances(
    params: DeleteInstancesRequest
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>(
      'POST',
      '/api/openapi-instance/v4/delete-instances',
      params
    );
  }

  /**
   * Describe instance details
   */
  async describeInstance(instanceId: string): Promise<InstanceDetails> {
    return this.request<InstanceDetails>(
      'GET',
      `/api/openapi-instance/v4/describe-instance?instanceId=${instanceId}`
    );
  }

  /**
   * Start instances (batch)
   */
  async startInstances(
    instanceIds: string[]
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>(
      'POST',
      '/api/openapi-instance/v4/batch-start-instances',
      { instanceIds } as BatchInstancesRequest
    );
  }

  /**
   * Stop instances (batch)
   */
  async stopInstances(
    instanceIds: string[]
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>(
      'POST',
      '/api/openapi-instance/v4/batch-stop-instances',
      { instanceIds } as BatchInstancesRequest
    );
  }

  /**
   * Reboot instances (batch)
   */
  async rebootInstances(
    instanceIds: string[]
  ): Promise<BatchOperationResponse> {
    return this.request<BatchOperationResponse>(
      'POST',
      '/api/openapi-instance/v4/batch-reboot-instances',
      { instanceIds } as BatchInstancesRequest
    );
  }

  /**
   * Describe available zones
   * Returns list of available zones (regions/availability zones)
   */
  async describeZones(): Promise<any[]> {
    try {
      // Try multiple possible endpoints
      const possiblePaths = [
        '/api/openapi-instance/v4/describe-zones',
        '/api/openapi-instance/v4/describe-availability-zones',
        '/api/v1/zones',
      ];

      for (const path of possiblePaths) {
        try {
          return await this.request<any[]>('GET', path);
        } catch (error) {
          // Continue to next path if this one fails
          continue;
        }
      }

      throw new Error('Unable to query zones from any known endpoint');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to describe a non-existent instance
      // If we get a proper error response, API is working
      await this.describeInstance('health-check-test-id');
      return true;
    } catch (error) {
      if (error instanceof ChinaMobileAPIError) {
        // If we get an API error, it means the API is responding
        // (even if the instance doesn't exist)
        return true;
      }
      return false;
    }
  }
}
