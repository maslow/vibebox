/**
 * Shared type definitions for VibeBox project
 *
 * This module contains types shared between client and server
 */

// User types (matches Prisma schema)
export interface PlatformUser {
  id: string;
  logtoId: string;
  email: string;
  name?: string;
  picture?: string;
  subscription: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: Date;
  updatedAt: Date;
}

// Happy account mapping (matches Prisma schema)
export interface HappyAccount {
  id: string;
  userId: string;
  happyToken: string;
  happySecret: string;
  machineId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// VibeBox types (matches Prisma schema)
export interface VibeBox {
  id: string;
  userId: string;
  name?: string;
  status: 'PROVISIONING' | 'ACTIVE' | 'INACTIVE' | 'ERROR';
  ipAddress?: string;
  sshPort?: number;
  createdAt: Date;
  updatedAt: Date;
}

// VibeBox connection info (for client)
export interface VibeBoxConnectionInfo {
  vibeBoxId: string;
  ipAddress: string | null;
  sshPort: number | null;
  sshCommand: string | null;
  happy: {
    token: string;
    secret: string;
    serverUrl: string;
  };
}

// API response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Happy credentials
export interface HappyCredentials {
  token: string;
  secret: string;
}

// Machine info (from Happy)
export interface MachineInfo {
  id: string;
  name: string;
  active: boolean;
  lastActiveAt: Date;
}

// Session info (from Happy)
export interface SessionInfo {
  id: string;
  machineId: string;
  path: string;
  createdAt: Date;
  updatedAt: Date;
}

// Control actions
export type VibeBoxControlAction = 'start' | 'stop' | 'restart';
