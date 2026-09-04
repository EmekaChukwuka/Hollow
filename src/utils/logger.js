import { env } from '../config/env.js';

// Log levels
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const currentLevel = env.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.INFO;

function formatMessage(level, message, data = null) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;

  if (data) {
    return `${prefix} ${message}\n${JSON.stringify(data, null, 2)}`;
  }
  return `${prefix} ${message}`;
}

export const logger = {
  debug(message, data = null) {
    if (currentLevel <= LOG_LEVELS.DEBUG) {
      console.debug(formatMessage('DEBUG', message, data));
    }
  },

  info(message, data = null) {
    if (currentLevel <= LOG_LEVELS.INFO) {
      console.log(formatMessage('INFO', message, data));
    }
  },

  warn(message, data = null) {
    if (currentLevel <= LOG_LEVELS.WARN) {
      console.warn(formatMessage('WARN', message, data));
    }
  },

  error(message, data = null) {
    if (currentLevel <= LOG_LEVELS.ERROR) {
      console.error(formatMessage('ERROR', message, data));
    }
  },

  // Log request details (shorter format for request logging)
  request(method, path, statusCode, duration) {
    const statusColor = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    this.debug(`${statusColor} ${method} ${path} → ${statusCode} (${duration}ms)`);
  }
};

// Export individual functions for convenience
export const { debug, info, warn, error, request } = logger;