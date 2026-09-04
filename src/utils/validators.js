import { ObjectId } from 'mongodb';
import { constants } from '../config/constants.js';

/**
 * Validate email address format
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase().trim());
}

/**
 * Validate URL format
 */
export function isValidUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate MongoDB ObjectId
 */
export function isObjectId(id) {
  if (!id) return false;
  try {
    return ObjectId.isValid(id) && new ObjectId(id).toString() === id.toString();
  } catch {
    return false;
  }
}

/**
 * Sanitize a path string (remove dangerous characters, ensure leading slash)
 */
export function sanitizePath(path) {
  if (!path || typeof path !== 'string') return '/';

  // Remove dangerous characters
  let sanitized = path.replace(/[^a-zA-Z0-9/:]/g, '');

  // Ensure it starts with /
  if (!sanitized.startsWith('/')) {
    sanitized = '/' + sanitized;
  }

  // Remove trailing slash if not root
  if (sanitized.length > 1 && sanitized.endsWith('/')) {
    sanitized = sanitized.slice(0, -1);
  }

  // Prevent path traversal
  sanitized = sanitized.replace(/\.\./g, '');

  return sanitized;
}

/**
 * Validate HTTP method
 */
export function isValidHttpMethod(method) {
  if (!method || typeof method !== 'string') return false;
  return constants.HTTP_METHODS.includes(method.toUpperCase());
}

/**
 * Validate HTTP status code
 */
export function isValidStatusCode(code) {
  if (typeof code !== 'number') return false;
  return code >= constants.STATUS_CODE_MIN && code <= constants.STATUS_CODE_MAX;
}

/**
 * Validate delay value (for static responses)
 */
export function isValidDelay(delay) {
  if (typeof delay !== 'number') return false;
  return delay >= 0 && delay <= constants.MAX_DELAY_MS;
}

/**
 * Validate endpoint mode
 */
export function isValidMode(mode) {
  return constants.ENDPOINT_MODES.includes(mode);
}

/**
 * Validate response scenario
 */
export function isValidScenario(scenario) {
  return constants.STATIC_SCENARIOS.includes(scenario);
}

/**
 * Validate validation type
 */
export function isValidValidationType(type) {
  return constants.VALIDATION_TYPES.includes(type);
}

/**
 * Sanitize string input (trim, remove extra spaces)
 */
export function sanitizeString(str) {
  if (!str || typeof str !== 'string') return '';
  return str.trim().replace(/\s+/g, ' ');
}

/**
 * Validate that an object has required fields
 */
export function hasRequiredFields(obj, requiredFields) {
  if (!obj || typeof obj !== 'object') return false;
  for (const field of requiredFields) {
    if (obj[field] === undefined || obj[field] === null || obj[field] === '') {
      return false;
    }
  }
  return true;
}

/**
 * Validate JSON string
 */
export function isValidJson(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}