/**
 * Providers Module
 * Main entry point for resource providers
 *
 * #provider #exports
 */

// Export types
export * from './types';

// Export base provider
export { BaseProvider } from './baseProvider';

// Export factory
export { ProviderFactory } from './factory';

// Export specific providers
export { ChinaMobileProvider } from './chinamobile';

// Re-export China Mobile types for convenience
export * from './chinamobile/types';
