/**
 * China Mobile Cloud API Client
 * Uses Portal Gateway for all API requests
 *
 * #chinamobile #api #client #ecs #portal-gateway
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
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
  poolId: string;
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
 * Portal Gateway Request Body
 */
interface PortalGatewayRequest {
  product: string;
  version: string;
  api: string;
  accessKey: string;
  secretKey: string;
  poolId: string;
  language: string;
  sdkVersion: string;
  bodyParameter?: any;
  queryParameter?: any;
  headerParameter?: any;
  pathParameter?: any; // 添加 pathParameter 支持
}

/**
 * Portal Gateway Response (nested structure)
 */
interface PortalGatewayResponse {
  requestId: string;
  state: string;
  body: {
    timeConsuming: string;
    responseBody: string; // JSON string that needs parsing
    requestHeader: Record<string, any>;
    responseHeader: Record<string, any>;
  };
}

/**
 * China Mobile Cloud API Client
 * All requests go through Portal Gateway
 */
export class ChinaMobileClient {
  private client: AxiosInstance;
  private accessKeyId: string;
  private accessKeySecret: string;
  private poolId: string;
  private gatewayUrl: string;

  constructor(config: ChinaMobileClientConfig) {
    this.accessKeyId = config.accessKeyId;
    this.accessKeySecret = config.accessKeySecret;
    this.poolId = config.poolId;

    const baseURL = config.endpoint || 'https://ecloud.10086.cn';
    this.gatewayUrl = '/api/query/openapi/apim/request/sdk';

    this.client = axios.create({
      baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ecloud-sdk-nodejs/1.0',
      },
    });
  }

  /**
   * Make Portal Gateway request
   * All API calls go through this unified gateway
   */
  private async portalRequest<T>(
    action: string,
    params?: {
      bodyParameter?: any;
      queryParameter?: any;
      headerParameter?: any;
      pathParameter?: any;
    }
  ): Promise<T> {
    const requestBody: PortalGatewayRequest = {
      product: 'ECS',
      version: 'v1',
      api: action,
      accessKey: this.accessKeyId,
      secretKey: this.accessKeySecret,
      poolId: this.poolId,
      language: 'Nodejs',
      sdkVersion: '1.0.1', // Node SDK 官方版本
      ...params,
    };

    try {
      const response = await this.client.post<PortalGatewayResponse>(
        this.gatewayUrl,
        requestBody
      );

      // Check gateway-level response
      if (response.data.state !== 'OK') {
        throw new ChinaMobileAPIError(
          'Gateway request failed',
          'GATEWAY_ERROR',
          response.data.requestId
        );
      }

      // Parse nested response body (it's a JSON string inside response.data.body.responseBody)
      if (!response.data.body || !response.data.body.responseBody) {
        throw new ChinaMobileAPIError(
          'Gateway returned no responseBody',
          'GATEWAY_INVALID_RESPONSE',
          response.data.requestId
        );
      }

      const actualResponse = JSON.parse(response.data.body.responseBody) as ChinaMobileResponse<T>;

      // Check response state
      if (actualResponse.state !== 'OK') {
        throw new ChinaMobileAPIError(
          actualResponse.errorMessage || 'API request failed',
          actualResponse.errorCode || 'UNKNOWN_ERROR',
          actualResponse.requestId
        );
      }

      // Return the actual body
      return actualResponse.body as T;
    } catch (error) {
      if (error instanceof ChinaMobileAPIError) {
        throw error;
      }

      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        // Try to parse error response
        if (axiosError.response?.data) {
          const errorData = axiosError.response.data as any;

          // If it's a gateway response, parse it
          if (errorData.body && errorData.body.responseBody) {
            try {
              const parsedError = JSON.parse(errorData.body.responseBody);
              throw new ChinaMobileAPIError(
                parsedError.errorMessage || axiosError.message,
                parsedError.errorCode || 'GATEWAY_ERROR',
                parsedError.requestId || errorData.requestId
              );
            } catch (parseError) {
              // Fall through to generic error
            }
          }
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
   * List instances
   * Action: vmListServe
   */
  async listInstances(params?: any): Promise<any> {
    return this.portalRequest('vmListServe', {
      bodyParameter: params || {},
    });
  }

  /**
   * Create instances
   * Action: vmCreate
   */
  async createInstances(
    params: CreateInstanceRequest
  ): Promise<CreateInstanceResponse> {
    return this.portalRequest<CreateInstanceResponse>('vmCreate', {
      bodyParameter: params,
    });
  }

  /**
   * Describe instance details
   * Action: vmGetServerDetail
   */
  async describeInstance(instanceId: string): Promise<InstanceDetails> {
    return this.portalRequest<InstanceDetails>('vmGetServerDetail', {
      pathParameter: { serverId: instanceId },
    });
  }

  /**
   * Start instance (single)
   * Action: vmStart
   */
  async startInstance(instanceId: string): Promise<any> {
    return this.portalRequest('vmStart', {
      pathParameter: { serverId: instanceId },
    });
  }

  /**
   * Stop instance (single)
   * Action: vmStop
   */
  async stopInstance(instanceId: string): Promise<any> {
    return this.portalRequest('vmStop', {
      pathParameter: { serverId: instanceId },
    });
  }

  /**
   * Reboot instance (single)
   * Action: vmReboot
   */
  async rebootInstance(instanceId: string): Promise<any> {
    return this.portalRequest('vmReboot', {
      pathParameter: { serverId: instanceId },
    });
  }

  /**
   * Delete instance (single)
   * Action: vmDelete
   */
  async deleteInstance(instanceId: string): Promise<any> {
    return this.portalRequest('vmDelete', {
      pathParameter: { serverId: instanceId },
    });
  }

  /**
   * Get product types/offers
   * Action: vmgetProductOfferIds
   */
  async getProductTypes(): Promise<any> {
    return this.portalRequest('vmgetProductOfferIds');
  }

  /**
   * Get flavors by region
   * Action: vmgetFlavorByRegion
   */
  async getFlavorsByRegion(regionId: string): Promise<any> {
    return this.portalRequest('vmgetFlavorByRegion', {
      bodyParameter: { regionId },
    });
  }

  /**
   * Health check - test API connectivity
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list instances
      await this.listInstances();
      return true;
    } catch (error) {
      if (error instanceof ChinaMobileAPIError) {
        // If we get an API error, it means the API is responding
        return true;
      }
      return false;
    }
  }
}
