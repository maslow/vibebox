/**
 * China Mobile Cloud Mappings
 * Status and spec mappings between China Mobile and unified format
 *
 * #chinamobile #mappings #status #specs
 */

import { ResourceStatus, ResourceSpec } from '../types';
import { FlavorInfo } from './types';

/**
 * Map China Mobile instance status to unified ResourceStatus
 */
export function mapStatus(chinamobileStatus: string): ResourceStatus {
  const statusMap: Record<string, ResourceStatus> = {
    // Confirmed status values
    active: ResourceStatus.RUNNING,
    'in-use': ResourceStatus.RUNNING,

    // Predicted status values (to be verified in testing)
    building: ResourceStatus.CREATING,
    creating: ResourceStatus.CREATING,
    pending: ResourceStatus.CREATING,

    stopped: ResourceStatus.STOPPED,
    shutoff: ResourceStatus.STOPPED,
    shutdown: ResourceStatus.STOPPED,

    starting: ResourceStatus.STARTING,
    'power-on': ResourceStatus.STARTING,

    stopping: ResourceStatus.STOPPING,
    'power-off': ResourceStatus.STOPPING,

    rebooting: ResourceStatus.RESTARTING,
    reboot: ResourceStatus.RESTARTING,

    deleting: ResourceStatus.DELETING,
    deleted: ResourceStatus.DELETED,

    error: ResourceStatus.ERROR,
    failed: ResourceStatus.ERROR,
  };

  const normalizedStatus = chinamobileStatus.toLowerCase();
  return statusMap[normalizedStatus] || ResourceStatus.UNKNOWN;
}

/**
 * Select best flavor based on resource spec
 */
export function selectFlavor(
  spec: ResourceSpec,
  availableFlavors: FlavorInfo[]
): FlavorInfo | null {
  // Filter flavors that meet CPU and memory requirements
  const suitableFlavors = availableFlavors.filter((flavor) => {
    const memoryGB = flavor.ram / 1024;
    return flavor.cpu >= spec.cpu && memoryGB >= spec.memory;
  });

  if (suitableFlavors.length === 0) {
    return null;
  }

  // Sort by total resources (CPU + memory) ascending to get smallest suitable flavor
  suitableFlavors.sort((a, b) => {
    const scoreA = a.cpu + a.ram / 1024;
    const scoreB = b.cpu + b.ram / 1024;
    return scoreA - scoreB;
  });

  // Return the smallest flavor that meets requirements
  return suitableFlavors[0];
}

/**
 * Map generic image name to China Mobile image ID
 * This is a simple mapping - in production, this should query available images
 */
export function mapImageName(imageName: string): string {
  const imageMap: Record<string, string> = {
    'ubuntu-22.04': 'ubuntu-22.04-base',
    'ubuntu-20.04': 'ubuntu-20.04-base',
    'centos-7': 'centos-7-base',
    'centos-8': 'centos-8-base',
    'debian-11': 'debian-11-base',
  };

  return imageMap[imageName] || imageName;
}

/**
 * Default flavor mappings for common specs
 * Used when flavor query is not available
 */
export function getDefaultFlavorMapping(spec: ResourceSpec): string {
  const { cpu, memory } = spec;

  // Common mappings based on documentation
  // Format: c{series}.{size}.{ratio}
  // where ratio is memory/cpu (e.g., 4 = 1:4 ratio = 2C8G)

  if (cpu === 2 && memory === 4) {
    return 's1.large.2'; // 2C4G - 1:2 ratio
  }

  if (cpu === 2 && memory === 8) {
    return 'c5.large.4'; // 2C8G - 1:4 ratio
  }

  if (cpu === 4 && memory === 8) {
    return 's1.xlarge.2'; // 4C8G - 1:2 ratio
  }

  if (cpu === 4 && memory === 16) {
    return 'c5.xlarge.4'; // 4C16G - 1:4 ratio
  }

  if (cpu === 8 && memory === 16) {
    return 's1.2xlarge.2'; // 8C16G - 1:2 ratio
  }

  if (cpu === 8 && memory === 32) {
    return 'c5.2xlarge.4'; // 8C32G - 1:4 ratio
  }

  // Default to general purpose with 1:2 ratio
  return `s1.large.${Math.floor(memory / cpu)}`;
}

/**
 * Get charge mode from spec
 */
export function getChargeMode(spec: ResourceSpec): 'HOUR' | 'MONTH' | 'YEAR' {
  // Can be extended to read from spec.tags or options
  return 'HOUR'; // Default to hourly billing
}

/**
 * Get volume type from spec
 */
export function getVolumeType(
  spec: ResourceSpec
): 'highPerformance' | 'ssd' | 'normal' {
  // Can be extended to read from spec options
  return 'highPerformance'; // Default to high performance
}

/**
 * Extract public IP from instance ports
 */
export function extractPublicIp(ports: any[]): string | undefined {
  for (const port of ports) {
    if (port.publicIp && port.publicIp.length > 0) {
      return port.publicIp[0];
    }
  }
  return undefined;
}

/**
 * Extract private IP from instance ports
 */
export function extractPrivateIp(ports: any[]): string | undefined {
  for (const port of ports) {
    if (port.privateIp && port.privateIp.length > 0) {
      return port.privateIp[0];
    }
  }
  return undefined;
}
