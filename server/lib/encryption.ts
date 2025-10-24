import * as crypto from 'crypto';

/**
 * Encryption utilities for securing sensitive data
 * Uses AES-256-GCM for encryption
 *
 * #encryption #security #aes
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Get encryption key from environment
 * In production, this should be stored in a secure secrets manager
 */
function getEncryptionKey(): Buffer {
    const key = process.env.ENCRYPTION_KEY;

    if (!key) {
        // In development, use a default key (NOT FOR PRODUCTION!)
        console.warn('ENCRYPTION_KEY not set, using default key (NOT FOR PRODUCTION!)');
        return Buffer.alloc(KEY_LENGTH);
    }

    // Parse key from hex or base64
    const keyBuffer = Buffer.from(key, 'hex').length === KEY_LENGTH
        ? Buffer.from(key, 'hex')
        : Buffer.from(key, 'base64');

    if (keyBuffer.length !== KEY_LENGTH) {
        throw new Error(`Encryption key must be ${KEY_LENGTH} bytes`);
    }

    return keyBuffer;
}

/**
 * Encrypt text using AES-256-GCM
 * Returns base64-encoded encrypted data with IV and auth tag
 *
 * @param text Plain text to encrypt
 * @returns Base64-encoded encrypted data (format: iv:tag:ciphertext)
 */
export function encrypt(text: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:tag:ciphertext (all in hex)
    const result = `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;

    return Buffer.from(result).toString('base64');
}

/**
 * Decrypt text using AES-256-GCM
 * Expects base64-encoded data in format: iv:tag:ciphertext
 *
 * @param encryptedData Base64-encoded encrypted data
 * @returns Decrypted plain text
 */
export function decrypt(encryptedData: string): string {
    const key = getEncryptionKey();

    // Decode from base64
    const decoded = Buffer.from(encryptedData, 'base64').toString('utf8');

    // Parse iv:tag:ciphertext
    const parts = decoded.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
    }

    const [ivHex, tagHex, encrypted] = parts;

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Generate a new random encryption key
 * Use this to generate ENCRYPTION_KEY for production
 *
 * @returns Hex-encoded encryption key
 */
export function generateEncryptionKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
}
