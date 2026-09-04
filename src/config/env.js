import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'MONGODB_URI',
  'JWT_SECRET'
];

const optionalEnvVars = [
  'NODE_ENV',
  'JWT_EXPIRY',
  'API_BASE_URL',
  'MAX_RESPONSE_SIZE',
  'DEFAULT_RATE_LIMIT',
  'PROJECT_ID_LENGTH',
  'API_KEY_PREFIX'
];

// Check required variables
const missing = requiredEnvVars.filter(key => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

// Build config object with defaults
export const env = {
  // Server
  PORT: parseInt(process.env.PORT, 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',

  // Database
  MONGODB_URI: process.env.MONGODB_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRY: process.env.JWT_EXPIRY || '7d',

  // App
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3000',
  MAX_RESPONSE_SIZE: parseInt(process.env.MAX_RESPONSE_SIZE || '1048576', 10),
  DEFAULT_RATE_LIMIT: parseInt(process.env.DEFAULT_RATE_LIMIT || '1000', 10),
  PROJECT_ID_LENGTH: parseInt(process.env.PROJECT_ID_LENGTH || '10', 10),
  API_KEY_PREFIX: process.env.API_KEY_PREFIX || 'sk_live_'
};