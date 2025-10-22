/**
 * Shared type definitions for Happy Vibe Server project
 *
 * This module contains types shared between client and server
 */

// User types
export interface PlatformUser {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Happy account mapping
export interface HappyAccountMapping {
  platformUserId: string;
  happyToken: string;
  happySecret: string;
  machineId?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Vibe server types
export interface VibeServer {
  id: string;
  userId: string;
  status: 'provisioning' | 'active' | 'inactive' | 'error';
  ipAddress?: string;
  sshPort?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Subscription types
export interface Subscription {
  id: string;
  userId: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'canceled' | 'past_due';
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
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
