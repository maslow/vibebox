/**
 * China Mobile Cloud Provider Types
 * Type definitions specific to China Mobile Cloud ECS API
 *
 * #chinamobile #types #ecs
 */

/**
 * China Mobile API response state
 */
export type ChinaMobileResponseState = 'OK' | 'ERROR' | 'EXCEPTION' | 'ALARM' | 'FORBIDDEN';

/**
 * Standard China Mobile API response format
 */
export interface ChinaMobileResponse<T = any> {
  requestId: string;
  state: ChinaMobileResponseState;
  body?: T;
  errorCode?: string;
  errorMessage?: string;
  errorParams?: string[];
}

/**
 * Batch operation result
 */
export interface BatchOperationResult {
  instanceId: string;
  result: boolean;
  message: string;
}

/**
 * Create instance request parameters
 */
export interface CreateInstanceRequest {
  zoneId: string;
  chargeMode: 'HOUR' | 'MONTH' | 'YEAR';
  flavorName: string;
  bootVolume: {
    size: number;
    volumeType: 'highPerformance' | 'ssd' | 'normal';
  };
  imageId: string;
  privateNetwork: {
    networkId: string;
    portType: number;
  };
  instanceName: string;
  password: string; // RSA encrypted
  quantity: number;
}

/**
 * Create instance response
 */
export interface CreateInstanceResponse {
  orderId: string;
  instanceIds: string[];
}

/**
 * Instance port information
 */
export interface InstancePort {
  id: string;
  privateIp: string[];
  publicIp?: string[];
  macAddress: string;
  vpcName: string;
  subnetName: string;
}

/**
 * Volume information
 */
export interface VolumeInfo {
  id: string;
  name: string;
  size: number;
  type: string;
  status: string;
}

/**
 * Instance details from describe-instance API
 */
export interface InstanceDetails {
  id: string;
  instanceName: string;
  status: string;
  flavorName: string;
  cpu: number;
  memory: number; // in MB
  disk: number;   // in GB
  zoneId: string;
  imageId: string;
  imageName: string;
  chargeMode: string;
  createdTime: string;
  modifiedTime: string;
  ports: InstancePort[];
  bootVolumeId: string;
  bootVolumeType: string;
  volumes?: VolumeInfo[];
  recycle: boolean;
}

/**
 * Delete instances request
 */
export interface DeleteInstancesRequest {
  instanceIds: string[];
  deletePublicNetwork: boolean;
  deleteDataVolumes: boolean;
}

/**
 * Batch instances request (start, stop, reboot)
 */
export interface BatchInstancesRequest {
  instanceIds: string[];
}

/**
 * Batch operation response
 */
export interface BatchOperationResponse {
  instanceBatchResult: BatchOperationResult[];
}

/**
 * Flavor information
 */
export interface FlavorInfo {
  flavorName: string;
  flavorType: string;
  cpu: number;
  ram: number; // in MB
}

/**
 * Describe resize flavors response
 */
export interface DescribeResizeFlavorsResponse {
  flavors: FlavorInfo[];
}

/**
 * Authentication parameters for China Mobile API
 */
export interface AuthParams {
  AccessKey: string;
  Signature: string;
  SignatureMethod: 'HmacSHA1';
  SignatureVersion: 'V2.0';
  SignatureNonce: string;
  Timestamp: string;
  Version: '2016-12-05';
}
