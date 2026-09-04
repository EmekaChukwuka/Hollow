import { EndpointModel } from '../models/Endpoint.js';
import { ProjectService } from './projectService.js';
import { ValidationService } from './validationService.js';
import { AppError, NotFoundError, ValidationError, ConflictError } from '../middleware/errorHandler.js';
import { constants } from '../config/constants.js';

export const EndpointService = {
  // Create a new endpoint
  async create(projectId, userId, data) {
    // Check project exists and user owns it
    await ProjectService.getById(projectId, userId);

    // Validate data
    const validation = EndpointModel.validateEndpointData(data);
    if (!validation.valid) {
      throw new ValidationError('Invalid endpoint data', validation.errors);
    }

    // Check for duplicate path
    const exists = await EndpointModel.pathExists(
      projectId,
      data.method,
      data.path
    );

    if (exists) {
      throw new ConflictError('Endpoint with this method and path already exists');
    }

    // If dynamic mode, ensure schema is valid
    if (data.mode === 'dynamic') {
      if (!data.schema || !data.schema.fields) {
        throw new ValidationError('Dynamic endpoints require a schema');
      }
    }

    // If static mode, ensure at least one response
    if (data.mode === 'static') {
      if (!data.responses || data.responses.length === 0) {
        throw new ValidationError('Static endpoints require at least one response');
      }
    }

    const endpoint = await EndpointModel.create(projectId, data);
    return endpoint;
  },

  // Get endpoint by ID
  async getById(endpointId, projectId = null) {
    const endpoint = await EndpointModel.findById(endpointId);
    if (!endpoint) {
      throw new NotFoundError('Endpoint not found');
    }

    if (projectId && endpoint.projectId.toString() !== projectId.toString()) {
      throw new AppError('Endpoint does not belong to this project', 403);
    }

    return endpoint;
  },

  // Get all endpoints for a project
  async getByProject(projectId, userId) {
    // Check project exists and user owns it
    await ProjectService.getById(projectId, userId);

    return await EndpointModel.findByProject(projectId);
  },

  // Find matching endpoint for a request
  async findMatch(projectId, method, path) {
    // Check project exists first
    const project = await ProjectService.getByProjectId(projectId);
    if (!project) {
      return null;
    }

    const match = await EndpointModel.findMatch(projectId, method, path);
    return match;
  },

  // Update endpoint
  async update(endpointId, projectId, userId, updates) {
    // Check ownership
    await ProjectService.getById(projectId, userId);
    const endpoint = await this.getById(endpointId, projectId);

    // Check for duplicate path if method or path is changing
    const newMethod = updates.method || endpoint.method;
    const newPath = updates.path || endpoint.path;

    if (newMethod !== endpoint.method || newPath !== endpoint.path) {
      const exists = await EndpointModel.pathExists(
        projectId,
        newMethod,
        newPath,
        endpointId
      );

      if (exists) {
        throw new ConflictError('Endpoint with this method and path already exists');
      }
    }

    // Validate updates
    const validation = EndpointModel.validateEndpointData({
      ...endpoint,
      ...updates
    });

    if (!validation.valid) {
      throw new ValidationError('Invalid endpoint data', validation.errors);
    }

    const updated = await EndpointModel.update(endpointId, updates);
    return updated;
  },

  // Delete endpoint
  async delete(endpointId, projectId, userId) {
    // Check ownership
    await ProjectService.getById(projectId, userId);
    await this.getById(endpointId, projectId);

    // Delete all data for this endpoint
    await DataModel.deleteByEndpointAll(endpointId);

    // Delete the endpoint
    const deleted = await EndpointModel.delete(endpointId);
    return deleted;
  },

  // Get default response for an endpoint (static mode)
  getDefaultResponse(endpoint) {
    if (endpoint.mode !== 'static') {
      return null;
    }
    return EndpointModel.getDefaultResponse(endpoint);
  },

  // Validate response for endpoint
  async validateResponse(endpoint, responseData) {
    if (endpoint.mode !== 'static') {
      return { valid: true };
    }

    // Check if response exists
    if (!responseData) {
      return {
        valid: false,
        error: 'Response not configured for this endpoint'
      };
    }

    return { valid: true };
  }
};