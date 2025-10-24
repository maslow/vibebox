/**
 * China Mobile Cloud Authentication Module
 * Implements HMAC-SHA1 signature authentication
 *
 * #chinamobile #auth #hmac #signature
 */

import * as crypto from 'crypto';
import { AuthParams } from './types';

/**
 * Generate authentication parameters for China Mobile API
 */
export function generateAuthParams(
  accessKeyId: string,
  accessKeySecret: string,
  additionalParams: Record<string, any> = {},
  host?: string
): AuthParams {
  // Generate nonce (unique random string)
  const nonce = crypto.randomUUID();

  // Generate timestamp in ISO format (GMT)
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Create auth parameters (without Host for now, as it may not be in signature)
  const authParams: AuthParams = {
    AccessKey: accessKeyId,
    SignatureMethod: 'HmacSHA1',
    SignatureVersion: 'V2.0',
    SignatureNonce: nonce,
    Timestamp: timestamp,
    Version: '2016-12-05',
    Signature: '', // Will be filled below
  };

  // Merge with additional parameters for signing
  const allParams = { ...authParams, ...additionalParams };

  // Calculate signature
  const signature = calculateSignature(allParams, accessKeySecret);

  // Add signature to auth params
  authParams.Signature = signature;

  return authParams;
}

/**
 * Calculate HMAC-SHA1 signature
 * Based on China Mobile's signing algorithm
 *
 * IMPORTANT: Signature is calculated on RAW parameter values (not URL-encoded).
 * URL encoding is only applied when building the final query string.
 */
export function calculateSignature(
  params: Record<string, any>,
  secretKey: string
): string {
  // 1. Sort parameters by key (alphabetically)
  const sortedKeys = Object.keys(params)
    .filter((key) => key !== 'Signature') // Exclude signature itself
    .sort();

  // 2. Build canonical query string with RAW values (no URL encoding)
  const canonicalString = sortedKeys
    .map((key) => {
      const value = params[key];
      // Handle different value types
      if (value === null || value === undefined) {
        return `${key}=`;
      }
      if (typeof value === 'object') {
        // For objects, stringify but don't encode (unlikely to be used in signature)
        return `${key}=${JSON.stringify(value)}`;
      }
      // Use raw string value - NO URL encoding
      return `${key}=${String(value)}`;
    })
    .join('&');

  // 3. Calculate HMAC-SHA1
  const signature = crypto
    .createHmac('sha1', secretKey)
    .update(canonicalString)
    .digest('hex');

  return signature;
}

/**
 * Verify signature (for testing purposes)
 */
export function verifySignature(
  params: Record<string, any>,
  secretKey: string,
  providedSignature: string
): boolean {
  const calculatedSignature = calculateSignature(params, secretKey);
  return calculatedSignature === providedSignature;
}

/**
 * Generate signature for HTTP headers authentication
 * Returns headers object ready to be added to request
 */
export function generateAuthHeaders(
  accessKeyId: string,
  accessKeySecret: string,
  method: string,
  path: string,
  body?: any
): Record<string, string> {
  const authParams = generateAuthParams(accessKeyId, accessKeySecret);

  return {
    'Content-Type': 'application/json',
    AccessKey: authParams.AccessKey,
    SignatureMethod: authParams.SignatureMethod,
    SignatureVersion: authParams.SignatureVersion,
    SignatureNonce: authParams.SignatureNonce,
    Timestamp: authParams.Timestamp,
    Version: authParams.Version,
    Signature: authParams.Signature,
  };
}

/**
 * Generate signature for URL query string authentication
 * Returns query parameters as string
 */
export function generateAuthQueryString(
  accessKeyId: string,
  accessKeySecret: string,
  additionalParams: Record<string, any> = {}
): string {
  const authParams = generateAuthParams(accessKeyId, accessKeySecret, additionalParams);

  const queryParams = new URLSearchParams();
  Object.entries(authParams).forEach(([key, value]) => {
    queryParams.append(key, String(value));
  });

  return queryParams.toString();
}
