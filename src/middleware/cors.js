import cors from 'cors';
import { constants } from '../config/constants.js';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // In development, allow all origins
    // In production, you'd want to check against allowed list
    callback(null, true);
  },
  methods: constants.CORS_ALLOWED_METHODS,
  allowedHeaders: constants.CORS_ALLOWED_HEADERS,
  credentials: true,
  optionsSuccessStatus: 204,
  maxAge: 86400 // 24 hours
});

// For the public API (no credentials)
export const publicCors = cors({
  origin: '*',
  methods: constants.CORS_ALLOWED_METHODS,
  allowedHeaders: constants.CORS_ALLOWED_HEADERS,
  maxAge: 86400
});