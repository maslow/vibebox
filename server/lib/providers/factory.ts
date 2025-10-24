/**
 * Provider Factory
 * Dynamic provider creation and registration
 *
 * #provider #factory #pattern
 */

import {
  IProviderFactory,
  IResourceProvider,
  ProviderType,
  ProviderConfig,
  ProviderError,
} from './types';
import { ChinaMobileProvider } from './chinamobile';

/**
 * Provider Factory Implementation
 */
class ProviderFactoryImpl implements IProviderFactory {
  private providers: Map<ProviderType, new () => IResourceProvider> = new Map();

  constructor() {
    // Auto-register built-in providers
    this.registerBuiltInProviders();
  }

  /**
   * Register built-in providers
   */
  private registerBuiltInProviders(): void {
    this.register(ProviderType.CHINAMOBILE, ChinaMobileProvider);
    // Future providers will be registered here:
    // this.register(ProviderType.ALIYUN, AliyunProvider);
    // this.register(ProviderType.TENCENT, TencentProvider);
    // this.register(ProviderType.DOCKER, DockerProvider);
  }

  /**
   * Register a provider class
   */
  register(type: ProviderType, providerClass: new () => IResourceProvider): void {
    if (this.providers.has(type)) {
      console.warn(`Provider ${type} is already registered, overwriting...`);
    }

    this.providers.set(type, providerClass);
    console.log(`Provider registered: ${type}`);
  }

  /**
   * Create a provider instance
   */
  async create(config: ProviderConfig): Promise<IResourceProvider> {
    const ProviderClass = this.providers.get(config.type);

    if (!ProviderClass) {
      throw new ProviderError(
        `Provider type '${config.type}' is not registered. Available providers: ${this.listProviders().join(', ')}`,
        'PROVIDER_NOT_FOUND',
        config.type
      );
    }

    try {
      // Instantiate provider
      const provider = new ProviderClass();

      // Initialize with config
      await provider.initialize(config);

      return provider;
    } catch (error) {
      throw new ProviderError(
        `Failed to create provider '${config.type}': ${error instanceof Error ? error.message : String(error)}`,
        'PROVIDER_CREATION_FAILED',
        config.type
      );
    }
  }

  /**
   * Get list of registered provider types
   */
  listProviders(): ProviderType[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Check if provider is registered
   */
  isRegistered(type: ProviderType): boolean {
    return this.providers.has(type);
  }

  /**
   * Unregister a provider (for testing)
   */
  unregister(type: ProviderType): boolean {
    return this.providers.delete(type);
  }
}

// Export singleton instance
export const ProviderFactory = new ProviderFactoryImpl();

// Export class for testing
export { ProviderFactoryImpl };
