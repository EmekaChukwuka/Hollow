import { env } from '../config/env.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log when response finishes
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const method = req.method;
    const url = req.url;

    // Color coding for status codes
    let statusColor = '\x1b[32m'; // green for 2xx
    if (status >= 400) statusColor = '\x1b[31m'; // red for 4xx/5xx
    if (status >= 300 && status < 400) statusColor = '\x1b[33m'; // yellow for 3xx

    const logLine = `${method} ${url} ${statusColor}${status}\x1b[0m ${duration}ms`;

    if (env.isDevelopment) {
      console.log(logLine);
    } else {
      // In production, you might want to use a proper logger
      // or send to a logging service
      if (status >= 400) {
        console.error(logLine);
      } else {
        console.log(logLine);
      }
    }
  });

  next();
}

// For logging errors
export function logError(message, error, context = {}) {
  console.error(`❌ ${message}`, {
    error: error.message,
    stack: error.stack,
    ...context
  });
}

// For logging info
export function logInfo(message, data = {}) {
  console.log(`ℹ️ ${message}`, data);
}