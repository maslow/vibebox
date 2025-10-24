/**
 * China Mobile Cloud Provider Implementation
 * Implements IResourceProvider for China Mobile Cloud ECS
 *
 * #chinamobile #provider #ecs #implementation
 */

import * as crypto from 'crypto';
import { BaseProvider } from './baseProvider';
import {
  ProviderType,
  ProviderConfig,
  ResourceSpec,
  ResourceInfo,
  ResourceStatus,
  ResourceNotFoundError,
  InvalidParameterError,
} from './types';
import { ChinaMobileClient } from './chinamobile/client';
import {
  CreateInstanceRequest,
  InstanceDetails,
} from './chinamobile/types';
import {
  mapStatus,
  mapImageName,
  getDefaultFlavorMapping,
  getChargeMode,
  getVolumeType,
  extractPublicIp,
  extractPrivateIp,
} from './chinamobile/mappings';

/**
 * China Mobile Cloud Provider
 */
export class ChinaMobileProvider extends BaseProvider {
  readonly type = ProviderType.CHINAMOBILE;
  readonly name = 'China Mobile Cloud ECS';

  private client!: ChinaMobileClient;
  private defaultZoneId: string = 'cn-jiangsu-1a'; // Default zone
  private defaultNetworkId: string = ''; // Will be set from config

  /**
   * Setup China Mobile client
   */
  protected async setupClient(config: ProviderConfig): Promise<void> {
    this.client = new ChinaMobileClient({
      accessKeyId: config.credentials.accessKeyId,
      accessKeySecret: config.credentials.accessKeySecret,
      endpoint: config.endpoint,
    });

    // Extract options
    if (config.options) {
      if (config.options.zoneId) {
        this.defaultZoneId = config.options.zoneId;
      }
      if (config.options.networkId) {
        this.defaultNetworkId = config.options.networkId;
      }
    }

    this.log('info', 'China Mobile Cloud provider initialized', {
      zoneId: this.defaultZoneId,
    });
  }

  /**
   * Validate provider configuration
   */
  protected async validateConfig(config: ProviderConfig): Promise<void> {
    await super.validateConfig(config);

    // China Mobile specific validation
    if (config.type !== ProviderType.CHINAMOBILE) {
      throw new InvalidParameterError(
        this.type,
        'type',
        `Expected type 'chinamobile', got '${config.type}'`
      );
    }
  }

  /**
   * Create a new instance
   */
  async createResource(spec: ResourceSpec): Promise<ResourceInfo> {
    this.ensureInitialized();

    this.log('info', 'Creating instance', { spec });

    try {
      // Map spec to China Mobile flavor
      const flavorName = getDefaultFlavorMapping(spec);

      // Map image name to image ID
      const imageId = mapImageName(spec.image || 'ubuntu-22.04');

      // Get network configuration
      const networkId = spec.networkConfig?.vpcId || this.defaultNetworkId;
      if (!networkId) {
        throw new InvalidParameterError(
          this.type,
          'networkId',
          'Network ID is required. Set it in config.options.networkId or spec.networkConfig.vpcId'
        );
      }

      // Encrypt password using RSA public key
      const password = this.generatePassword();
      const encryptedPassword = this.encryptPassword(password);

      // Prepare create request
      const createRequest: CreateInstanceRequest = {
        zoneId: spec.region || this.defaultZoneId,
        chargeMode: getChargeMode(spec),
        flavorName,
        bootVolume: {
          size: spec.disk,
          volumeType: getVolumeType(spec),
        },
        imageId,
        privateNetwork: {
          networkId,
          portType: 0,
        },
        instanceName: spec.tags?.name || `instance-${Date.now()}`,
        password: encryptedPassword,
        quantity: 1,
      };

      // Create instance
      const response = await this.client.createInstances(createRequest);

      if (response.instanceIds.length === 0) {
        throw new Error('No instance ID returned from create API');
      }

      const instanceId = response.instanceIds[0];

      this.log('info', 'Instance creation initiated', {
        instanceId,
        orderId: response.orderId,
      });

      // Return initial resource info
      // Status will be CREATING, client should poll for RUNNING
      return {
        id: instanceId,
        status: ResourceStatus.CREATING,
        sshPort: 22,
        sshUser: 'root',
        sshPassword: password, // Return unencrypted password for user
        metadata: {
          orderId: response.orderId,
          flavorName,
          imageId,
          zoneId: spec.region || this.defaultZoneId,
        },
        createdAt: new Date(),
      };
    } catch (error) {
      this.log('error', 'Failed to create instance', { error });
      throw error;
    }
  }

  /**
   * Get instance information
   */
  async getResourceInfo(resourceId: string): Promise<ResourceInfo> {
    this.ensureInitialized();

    try {
      const instance = await this.client.describeInstance(resourceId);
      return this.mapInstanceToResourceInfo(instance);
    } catch (error: any) {
      // Check if instance not found
      if (error.code === 'INSTANCE_NOT_FOUND' || error.code === 'InvalidInstanceId') {
        throw new ResourceNotFoundError(this.type, resourceId);
      }
      throw error;
    }
  }

  /**
   * Start a stopped instance
   */
  async startResource(resourceId: string): Promise<void> {
    this.ensureInitialized();

    this.log('info', 'Starting instance', { instanceId: resourceId });

    try {
      const response = await this.client.startInstances([resourceId]);

      // Check result
      const result = response.instanceBatchResult[0];
      if (!result.result) {
        throw new Error(`Failed to start instance: ${result.message}`);
      }

      this.log('info', 'Instance start initiated', { instanceId: resourceId });
    } catch (error) {
      this.log('error', 'Failed to start instance', { instanceId: resourceId, error });
      throw error;
    }
  }

  /**
   * Stop a running instance
   */
  async stopResource(resourceId: string): Promise<void> {
    this.ensureInitialized();

    this.log('info', 'Stopping instance', { instanceId: resourceId });

    try {
      const response = await this.client.stopInstances([resourceId]);

      // Check result
      const result = response.instanceBatchResult[0];
      if (!result.result) {
        throw new Error(`Failed to stop instance: ${result.message}`);
      }

      this.log('info', 'Instance stop initiated', { instanceId: resourceId });
    } catch (error) {
      this.log('error', 'Failed to stop instance', { instanceId: resourceId, error });
      throw error;
    }
  }

  /**
   * Restart an instance
   */
  async restartResource(resourceId: string): Promise<void> {
    this.ensureInitialized();

    this.log('info', 'Restarting instance', { instanceId: resourceId });

    try {
      const response = await this.client.rebootInstances([resourceId]);

      // Check result
      const result = response.instanceBatchResult[0];
      if (!result.result) {
        throw new Error(`Failed to restart instance: ${result.message}`);
      }

      this.log('info', 'Instance restart initiated', { instanceId: resourceId });
    } catch (error) {
      this.log('error', 'Failed to restart instance', { instanceId: resourceId, error });
      throw error;
    }
  }

  /**
   * Delete an instance permanently
   */
  async deleteResource(resourceId: string): Promise<void> {
    this.ensureInitialized();

    this.log('info', 'Deleting instance', { instanceId: resourceId });

    try {
      const response = await this.client.deleteInstances({
        instanceIds: [resourceId],
        deletePublicNetwork: true,
        deleteDataVolumes: true,
      });

      // Check result
      const result = response.instanceBatchResult[0];
      if (!result.result) {
        throw new Error(`Failed to delete instance: ${result.message}`);
      }

      this.log('info', 'Instance deletion initiated', { instanceId: resourceId });
    } catch (error) {
      this.log('error', 'Failed to delete instance', { instanceId: resourceId, error });
      throw error;
    }
  }

  /**
   * Perform health check
   */
  protected async performHealthCheck(): Promise<boolean> {
    try {
      return await this.client.healthCheck();
    } catch (error) {
      this.log('error', 'Health check failed', { error });
      return false;
    }
  }

  /**
   * Map China Mobile instance details to ResourceInfo
   */
  private mapInstanceToResourceInfo(instance: InstanceDetails): ResourceInfo {
    return {
      id: instance.id,
      status: mapStatus(instance.status),
      ipAddress: extractPublicIp(instance.ports),
      privateIp: extractPrivateIp(instance.ports),
      sshPort: 22,
      sshUser: 'root',
      metadata: {
        instanceName: instance.instanceName,
        flavorName: instance.flavorName,
        cpu: instance.cpu,
        memory: instance.memory,
        disk: instance.disk,
        zoneId: instance.zoneId,
        imageId: instance.imageId,
        imageName: instance.imageName,
        chargeMode: instance.chargeMode,
        bootVolumeId: instance.bootVolumeId,
        bootVolumeType: instance.bootVolumeType,
        ports: instance.ports,
      },
      createdAt: new Date(instance.createdTime),
      updatedAt: new Date(instance.modifiedTime),
    };
  }

  /**
   * Generate random password
   */
  private generatePassword(): string {
    // Generate 16-character password with letters, numbers, and symbols
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Encrypt password using RSA public key
   * Uses the public key provided in China Mobile documentation
   */
  private encryptPassword(password: string): string {
    const publicKeyPem = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC/VpRysi0bPRLS7sbgQDJHo1MA
t9/bK+nwK5Pe3z0/O4cH5I/8kFNYy4yFsLMM+zyFvVw9C4wzjHaRcmEuF3ziJMC9
PD5ufUWgfO5nSGgZW1cmgjqnhcWJ3i+Azj72RnhKQRCn9DgJduEC9MiKfbyTICGd
6FXf9cxb21nkxI7vtwIDAQAB
-----END PUBLIC KEY-----`;

    // Encrypt using RSA-OAEP
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKeyPem,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(password, 'utf8')
    );

    return encrypted.toString('base64');
  }
}
