/**
 * Resource Provider Types and Interfaces
 * Unified abstraction layer for multi-cloud providers
 *
 * #provider #types #abstraction #multi-cloud
 */

/**
 * Provider type enum
 */
export enum ProviderType {
  CHINAMOBILE = 'chinamobile',
  ALIYUN = 'aliyun',
  TENCENT = 'tencent',
  DOCKER = 'docker',
  AWS = 'aws',
  KUBERNETES = 'kubernetes',
}

/**
 * Unified resource status across all providers
 */
export enum ResourceStatus {
  CREATING = 'CREATING',     // Creating new resource
  RUNNING = 'RUNNING',       // Resource is running
  STOPPED = 'STOPPED',       // Resource is stopped
  STARTING = 'STARTING',     // Resource is starting
  STOPPING = 'STOPPING',     // Resource is stopping
  RESTARTING = 'RESTARTING', // Resource is restarting
  DELETING = 'DELETING',     // Resource is being deleted
  DELETED = 'DELETED',       // Resource has been deleted
  ERROR = 'ERROR',           // Resource is in error state
  UNKNOWN = 'UNKNOWN',       // Unknown status
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
  type: ProviderType;
  credentials: {
    accessKeyId: string;
    accessKeySecret: string;
  };
  region?: string;
  endpoint?: string;
  options?: Record<string, any>;
}

/**
 * Resource specification (what business layer requests)
 */
export interface ResourceSpec {
  cpu: number;           // CPU cores
  memory: number;        // Memory in GB
  disk: number;          // Disk in GB
  region?: string;       // Region preference
  image?: string;        // OS image (e.g., 'ubuntu-22.04', 'centos-7')
  tags?: Record<string, string>; // Resource tags
  networkConfig?: {
    vpcId?: string;
    subnetId?: string;
    securityGroupIds?: string[];
  };
}

/**
 * Resource information (what provider returns)
 */
export interface ResourceInfo {
  id: string;                    // Cloud provider's resource ID
  status: ResourceStatus;        // Unified status
  ipAddress?: string;            // Public IP address
  privateIp?: string;            // Private IP address
  sshPort: number;               // SSH port (default 22)
  sshUser: string;               // SSH username
  sshPassword?: string;          // Temporary SSH password (if applicable)
  sshKeyPath?: string;           // SSH key path (if applicable)
  metadata: {                    // Provider-specific metadata
    instanceType?: string;
    region?: string;
    imageId?: string;
    [key: string]: any;
  };
  createdAt: Date;              // Creation timestamp
  updatedAt?: Date;             // Last update timestamp
}

/**
 * Provider health check result
 */
export interface ProviderHealthStatus {
  healthy: boolean;
  message?: string;
  lastChecked: Date;
}

/**
 * Wait for status options
 */
export interface WaitForStatusOptions {
  targetStatus: ResourceStatus;
  timeout?: number;          // Timeout in milliseconds (default: 600000 = 10 min)
  interval?: number;         // Polling interval in milliseconds (default: 5000 = 5 sec)
}

/**
 * Resource Provider Interface
 * All providers must implement this interface
 */
export interface IResourceProvider {
  /**
   * Provider type identifier
   */
  readonly type: ProviderType;

  /**
   * Provider display name
   */
  readonly name: string;

  /**
   * Initialize the provider with configuration
   */
  initialize(config: ProviderConfig): Promise<void>;

  /**
   * Create a new resource
   */
  createResource(spec: ResourceSpec): Promise<ResourceInfo>;

  /**
   * Get resource information
   */
  getResourceInfo(resourceId: string): Promise<ResourceInfo>;

  /**
   * Start a stopped resource
   */
  startResource(resourceId: string): Promise<void>;

  /**
   * Stop a running resource
   */
  stopResource(resourceId: string): Promise<void>;

  /**
   * Restart a resource
   */
  restartResource(resourceId: string): Promise<void>;

  /**
   * Delete a resource permanently
   */
  deleteResource(resourceId: string): Promise<void>;

  /**
   * Wait for resource to reach target status
   */
  waitForStatus(resourceId: string, options: WaitForStatusOptions): Promise<ResourceInfo>;

  /**
   * Check if provider is healthy and accessible
   */
  healthCheck(): Promise<ProviderHealthStatus>;
}

/**
 * Provider factory interface
 */
export interface IProviderFactory {
  /**
   * Register a provider class
   */
  register(type: ProviderType, providerClass: new () => IResourceProvider): void;

  /**
   * Create a provider instance
   */
  create(config: ProviderConfig): Promise<IResourceProvider>;

  /**
   * Get list of registered provider types
   */
  listProviders(): ProviderType[];
}

/**
 * Provider error types
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: ProviderType
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ResourceNotFoundError extends ProviderError {
  constructor(provider: ProviderType, resourceId: string) {
    super(`Resource ${resourceId} not found`, 'RESOURCE_NOT_FOUND', provider);
    this.name = 'ResourceNotFoundError';
  }
}

export class InsufficientQuotaError extends ProviderError {
  constructor(provider: ProviderType, message: string) {
    super(message, 'INSUFFICIENT_QUOTA', provider);
    this.name = 'InsufficientQuotaError';
  }
}

export class InvalidParameterError extends ProviderError {
  constructor(provider: ProviderType, parameter: string, message: string) {
    super(`Invalid parameter ${parameter}: ${message}`, 'INVALID_PARAMETER', provider);
    this.name = 'InvalidParameterError';
  }
}

export class OperationTimeoutError extends ProviderError {
  constructor(provider: ProviderType, operation: string, timeout: number) {
    super(
      `Operation ${operation} timed out after ${timeout}ms`,
      'OPERATION_TIMEOUT',
      provider
    );
    this.name = 'OperationTimeoutError';
  }
}
