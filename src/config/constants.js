export const constants = {
  // HTTP Methods
  HTTP_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

  // Endpoint modes
  ENDPOINT_MODES: ['static', 'dynamic'],

  // Status codes ranges
  STATUS_CODE_MIN: 100,
  STATUS_CODE_MAX: 599,

  // Response limits
  MAX_DELAY_MS: 30000, // 30 seconds
  MAX_RESPONSE_BODY_SIZE: 1048576, // 1MB

  // Pagination defaults
  DEFAULT_PAGE_LIMIT: 50,
  MAX_PAGE_LIMIT: 100,

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: 60000, // 1 minute
  RATE_LIMIT_DEFAULT: 1000,

  // ID generation
  PROJECT_ID_PREFIX: 'proj_',
  ENDPOINT_ID_PREFIX: 'ep_',
  API_KEY_PREFIX: 'sk_live_',

  // CORS defaults
  CORS_ALLOWED_ORIGINS: ['*'],
  CORS_ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  CORS_ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-API-Key'],

  // Response scenarios
  STATIC_SCENARIOS: ['default', 'success', 'error', 'unauthorized', 'notFound', 'serverError'],

  // Validation types
  VALIDATION_TYPES: ['string', 'number', 'boolean', 'array', 'object', 'email', 'url'],

  // Error messages
  ERRORS: {
    PROJECT_NOT_FOUND: 'Project not found',
    ENDPOINT_NOT_FOUND: 'Endpoint not found',
    DUPLICATE_ENDPOINT: 'Endpoint already exists',
    INVALID_API_KEY: 'Invalid or missing API key',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    VALIDATION_FAILED: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
    INVALID_REQUEST: 'Invalid request'
  }
};