// src/routes/publicRoutes.js
import { Router } from 'express';
import { ProjectService } from '../services/projectService.js';
import { EndpointService } from '../services/endpointService.js';
import { DataService } from '../services/dataService.js';
import { logger } from '../utils/logger.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Handle all public requests
router.all('/*', async (req, res, next) => {
  const startTime = Date.now();

  try {
    // 🔥 SAFETY: Skip API and auth routes (shouldn't reach here if order is correct)
    if (req.path.startsWith('/api/') || req.path.startsWith('/auth/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }

    // Extract projectId from URL
    const pathParts = req.path.split('/').filter(Boolean);
    if (pathParts.length === 0) {
      throw new AppError('Project ID required', 400);
    }

    const projectId = pathParts[0];
    const apiPath = '/' + pathParts.slice(1).join('/');

    logger.debug(`Public request: ${req.method} ${apiPath} (project: ${projectId})`);

    // 1. Find project
    const project = await ProjectService.getByProjectId(projectId);
    if (!project) {
      throw new AppError('Project not found', 404);
    }

    // 2. Validate API key if required
    const apiKey = req.headers['x-api-key'];
    if (project.requireApiKey) {
      const isValid = await ProjectService.validateApiKey(project._id, apiKey);
      if (!isValid) {
        throw new AppError('Invalid or missing API key', 401);
      }
    }

    // 3. Find matching endpoint
    const match = await EndpointService.findMatch(project._id, req.method, apiPath);
    if (!match) {
      throw new AppError('Endpoint not found', 404);
    }

    const { endpoint, params } = match;

    // 4. Handle based on mode
    if (endpoint.mode === 'static') {
      await handleStatic(req, res, endpoint);
    } else {
      await handleDynamic(req, res, endpoint, params, project._id);
    }

    // Log successful request
    const duration = Date.now() - startTime;
    logger.request(req.method, apiPath, res.statusCode, duration);

  } catch (error) {
    // Log failed request
    const duration = Date.now() - startTime;
    logger.request(req.method, req.path, error.statusCode || 500, duration);
    next(error);
  }
});

// Handle static mode
async function handleStatic(req, res, endpoint) {
  const response = EndpointService.getDefaultResponse(endpoint);
  if (!response) {
    throw new AppError('No response configured for this endpoint', 500);
  }

  // Apply delay
  if (response.delayMs > 0) {
    await new Promise(resolve => setTimeout(resolve, response.delayMs));
  }

  // Set headers
  if (response.headers) {
    Object.entries(response.headers).forEach(([key, value]) => {
      res.setHeader(key, value);
    });
  }

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Send response
  res.status(response.statusCode).json(response.body);
}

// Handle dynamic mode
async function handleDynamic(req, res, endpoint, params, projectId) {
  const endpointId = endpoint._id.toString();
  const pathSegments = req.path.split('/').filter(Boolean).slice(1);
  const hasId = pathSegments.length > 1;
  const id = hasId ? pathSegments[pathSegments.length - 1] : null;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  let result;

  switch (req.method) {
    case 'GET':
      if (id) {
        result = await DataService.findOne(projectId, endpointId, null, id);
        if (!result) {
          throw new AppError('Item not found', 404);
        }
        return res.json(result);
      } else {
        const query = req.query;
        result = await DataService.findAll(projectId, endpointId, null, query);
        return res.json(result);
      }

    case 'POST':
      result = await DataService.create(
        projectId,
        endpointId,
        null,
        req.body
      );
      return res.status(201).json(result);

    case 'PUT':
      if (!id) {
        throw new AppError('ID required for update', 400);
      }
      result = await DataService.update(
        projectId,
        endpointId,
        null,
        id,
        req.body
      );
      if (!result) {
        throw new AppError('Item not found', 404);
      }
      return res.json(result);

    case 'PATCH':
      if (!id) {
        throw new AppError('ID required for update', 400);
      }
      const existing = await DataService.findOne(projectId, endpointId, null, id);
      if (!existing) {
        throw new AppError('Item not found', 404);
      }
      const mergedData = { ...existing.data, ...req.body };
      result = await DataService.update(
        projectId,
        endpointId,
        null,
        id,
        mergedData
      );
      return res.json(result);

    case 'DELETE':
      if (!id) {
        throw new AppError('ID required for delete', 400);
      }
      const deleted = await DataService.delete(projectId, endpointId, null, id);
      if (!deleted) {
        throw new AppError('Item not found', 404);
      }
      return res.status(204).send();

    default:
      throw new AppError('Method not allowed', 405);
  }
}

// Handle OPTIONS for CORS preflight
router.options('/*', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  res.sendStatus(204);
});

export const publicRoutes = router;