/**
 * Base Resource Provider Implementation
 * Provides common functionality for all providers
 *
 * #provider #base #abstraction
 */

import {
  IResourceProvider,
  ProviderType,
  ProviderConfig,
  ResourceSpec,
  ResourceInfo,
  ResourceStatus,
  WaitForStatusOptions,
  ProviderHealthStatus,
  OperationTimeoutError,
  InvalidParameterError,
} from './types';

/**
 * Base provider class with common functionality
 * All provider implementations should extend this class
 */
export abstract class BaseProvider implements IResourceProvider {
  abstract readonly type: ProviderType;
  abstract readonly name: string;

  protected config!: ProviderConfig;
  protected initialized: boolean = false;

  /**
   * Initialize the provider
   */
  async initialize(config: ProviderConfig): Promise<void> {
    // Validate configuration
    await this.validateConfig(config);

    // Store configuration
    this.config = config;

    // Setup provider-specific client
    await this.setupClient(config);

    this.initialized = true;
  }

  /**
   * Validate provider configuration
   * Override this to add provider-specific validation
   */
  protected async validateConfig(config: ProviderConfig): Promise<void> {
    if (!config.credentials) {
      throw new InvalidParameterError(this.type, 'credentials', 'Credentials are required');
    }

    if (!config.credentials.accessKeyId) {
      throw new InvalidParameterError(
        this.type,
        'credentials.accessKeyId',
        'Access Key ID is required'
      );
    }

    if (!config.credentials.accessKeySecret) {
      throw new InvalidParameterError(
        this.type,
        'credentials.accessKeySecret',
        'Access Key Secret is required'
      );
    }
  }

  /**
   * Setup provider-specific client
   * Override this to initialize SDK or API client
   */
  protected abstract setupClient(config: ProviderConfig): Promise<void>;

  /**
   * Ensure provider is initialized before operations
   */
  protected ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Provider ${this.type} is not initialized. Call initialize() first.`);
    }
  }

  /**
   * Create a new resource
   */
  abstract createResource(spec: ResourceSpec): Promise<ResourceInfo>;

  /**
   * Get resource information
   */
  abstract getResourceInfo(resourceId: string): Promise<ResourceInfo>;

  /**
   * Start a stopped resource
   */
  abstract startResource(resourceId: string): Promise<void>;

  /**
   * Stop a running resource
   */
  abstract stopResource(resourceId: string): Promise<void>;

  /**
   * Restart a resource
   */
  abstract restartResource(resourceId: string): Promise<void>;

  /**
   * Delete a resource permanently
   */
  abstract deleteResource(resourceId: string): Promise<void>;

  /**
   * Wait for resource to reach target status
   * Default implementation with polling
   */
  async waitForStatus(
    resourceId: string,
    options: WaitForStatusOptions
  ): Promise<ResourceInfo> {
    this.ensureInitialized();

    const { targetStatus, timeout = 600000, interval = 5000 } = options;

    const startTime = Date.now();
    const endTime = startTime + timeout;

    while (Date.now() < endTime) {
      const info = await this.getResourceInfo(resourceId);

      // Check if reached target status
      if (info.status === targetStatus) {
        return info;
      }

      // Check for error state
      if (info.status === ResourceStatus.ERROR) {
        throw new Error(
          `Resource ${resourceId} entered ERROR state while waiting for ${targetStatus}`
        );
      }

      // Wait before next poll
      await this.sleep(interval);
    }

    throw new OperationTimeoutError(
      this.type,
      `waitForStatus(${targetStatus})`,
      timeout
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<ProviderHealthStatus> {
    try {
      this.ensureInitialized();
      const healthy = await this.performHealthCheck();

      return {
        healthy,
        message: healthy ? 'Provider is healthy' : 'Provider is unhealthy',
        lastChecked: new Date(),
      };
    } catch (error) {
      return {
        healthy: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: new Date(),
      };
    }
  }

  /**
   * Perform provider-specific health check
   * Override this to implement custom health check logic
   */
  protected abstract performHealthCheck(): Promise<boolean>;

  /**
   * Sleep utility
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Retry with exponential backoff
   */
  protected async retryWithBackoff<T>(
    operation: () => Promise<T>,
    options: {
      maxRetries?: number;
      initialDelay?: number;
      maxDelay?: number;
      factor?: number;
    } = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      initialDelay = 1000,
      maxDelay = 16000,
      factor = 2,
    } = options;

    let lastError: Error;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Wait before retry
        await this.sleep(delay);

        // Exponential backoff
        delay = Math.min(delay * factor, maxDelay);
      }
    }

    throw new Error(
      `Operation failed after ${maxRetries + 1} attempts: ${lastError!.message}`
    );
  }

  /**
   * Log helper (can be replaced with proper logger)
   */
  protected log(level: 'info' | 'warn' | 'error', message: string, meta?: any): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    console.log(`[${timestamp}] [${level.toUpperCase()}] [${this.name}] ${message}${metaStr}`);
  }
}
