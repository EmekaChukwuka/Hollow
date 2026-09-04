/**
 * Match a path pattern with parameters against an actual path.
 * 
 * Examples:
 * matchPath('/users/:id', '/users/123') → { id: '123' }
 * matchPath('/users/:id/posts/:postId', '/users/123/posts/456') → { id: '123', postId: '456' }
 * matchPath('/users', '/users') → {}
 * matchPath('/users/:id', '/users') → null
 * matchPath('/users/:id', '/users/123/extra') → null
 */
export function matchPath(pattern, path) {
  // Normalize paths: remove leading/trailing slashes
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  // If lengths don't match, no match
  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params = {};

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    // Check if this part is a parameter
    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    } else if (patternPart !== pathPart) {
      // Static part doesn't match
      return null;
    }
  }

  return params;
}

/**
 * Check if a path contains parameters.
 * Example: hasParams('/users/:id') → true
 * hasParams('/users') → false
 */
export function hasParams(pattern) {
  return pattern.split('/').some(part => part.startsWith(':'));
}

/**
 * Extract parameter names from a path pattern.
 * Example: getParamNames('/users/:id/posts/:postId') → ['id', 'postId']
 */
export function getParamNames(pattern) {
  const parts = pattern.split('/').filter(Boolean);
  return parts
    .filter(part => part.startsWith(':'))
    .map(part => part.slice(1));
}

/**
 * Build a path from a pattern with parameters.
 * Example: buildPath('/users/:id', { id: '123' }) → '/users/123'
 */
export function buildPath(pattern, params = {}) {
  let path = pattern;
  for (const [key, value] of Object.entries(params)) {
    path = path.replace(`:${key}`, value);
  }
  return path;
}

/**
 * Check if a path pattern matches a path, returning both params and the matched pattern.
 * Useful for finding the most specific match.
 */
export function findBestMatch(pattern, path) {
  const params = matchPath(pattern, path);
  if (!params) {
    return null;
  }

  // Count static parts for specificity
  const staticParts = pattern.split('/').filter(p => !p.startsWith(':') && p.length > 0);
  const paramParts = pattern.split('/').filter(p => p.startsWith(':'));

  return {
    pattern,
    params,
    specificity: staticParts.length,
    hasParams: paramParts.length > 0
  };
}