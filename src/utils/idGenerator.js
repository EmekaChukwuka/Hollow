import { randomBytes } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { constants } from '../config/constants.js';

// Generate a short random string
export function generateShortId(length = 10) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = randomBytes(length);

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

// Generate a project ID (e.g., proj_abc123)
export function generateProjectId() {
  const prefix = constants.PROJECT_ID_PREFIX || 'proj_';
  const length = constants.PROJECT_ID_LENGTH || 10;
  return `${prefix}${generateShortId(length)}`;
}

// Generate an API key (e.g., sk_live_xyz789...)
export function generateApiKey() {
  const prefix = constants.API_KEY_PREFIX || 'sk_live_';
  const bytes = randomBytes(32);
  const key = bytes.toString('hex');
  return `${prefix}${key}`;
}

// Generate UUID
export function generateUuid() {
  return uuidv4();
}

// Generate a secure random token (for password reset, etc.)
export function generateSecureToken(length = 32) {
  return randomBytes(length).toString('hex');
}

// Check if string is a valid project ID format
export function isValidProjectId(id) {
  const prefix = constants.PROJECT_ID_PREFIX || 'proj_';
  return id && id.startsWith(prefix) && id.length >= prefix.length + 4;
}

// Check if string is a valid API key format
export function isValidApiKey(key) {
  const prefix = constants.API_KEY_PREFIX || 'sk_live_';
  return key && key.startsWith(prefix) && key.length >= prefix.length + 32;
}

// Generate a deterministic ID from a string (for testing)
export function generateDeterministicId(seed, length = 10) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }

  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  let seedValue = Math.abs(hash);

  for (let i = 0; i < length; i++) {
    result += chars[seedValue % chars.length];
    seedValue = Math.floor(seedValue / chars.length);
  }

  return result;
}