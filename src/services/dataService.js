import { DataModel } from '../models/Data.js';
import { EndpointService } from './endpointService.js';
import { ProjectService } from './projectService.js';
import { ValidationService } from './validationService.js';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler.js';

export const DataService = {
  // Create new data document
  async create(projectId, endpointId, userId, data, schema = null) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    const endpoint = await EndpointService.getById(endpointId, projectId);

    // Ensure endpoint is dynamic
    if (endpoint.mode !== 'dynamic') {
      throw new ValidationError('Cannot store data on a static endpoint');
    }

    // Validate against schema
    const validation = ValidationService.validate(data, endpoint.schema || { fields: {} });
    if (!validation.valid) {
      throw new ValidationError('Validation failed', validation.errors);
    }

    const doc = await DataModel.create(projectId, endpointId, validation.data);
    return doc;
  },

  // Get all data for an endpoint with pagination
  async findAll(projectId, endpointId, userId, query = {}) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    const result = await DataModel.findByEndpoint(endpointId, query);
    return result;
  },

  // Get single data document
  async findOne(projectId, endpointId, userId, dataId) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    const doc = await DataModel.findOneByEndpoint(endpointId, dataId);
    if (!doc) {
      throw new NotFoundError('Data not found');
    }

    return doc;
  },

  // Update data document
  async update(projectId, endpointId, userId, dataId, data, schema = null) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    // Check document exists and belongs to endpoint
    const exists = await DataModel.belongsToEndpoint(dataId, endpointId);
    if (!exists) {
      throw new NotFoundError('Data not found');
    }

    // Get endpoint for schema
    const endpoint = await EndpointService.getById(endpointId, projectId);

    // Validate against schema
    const validation = ValidationService.validate(data, endpoint.schema || { fields: {} });
    if (!validation.valid) {
      throw new ValidationError('Validation failed', validation.errors);
    }

    const updated = await DataModel.updateByEndpoint(endpointId, dataId, validation.data);
    return updated;
  },

  // Delete data document
  async delete(projectId, endpointId, userId, dataId) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    // Check document exists and belongs to endpoint
    const exists = await DataModel.belongsToEndpoint(dataId, endpointId);
    if (!exists) {
      throw new NotFoundError('Data not found');
    }

    const deleted = await DataModel.deleteByEndpoint(endpointId, dataId);
    return deleted;
  },

  // Clear all data for an endpoint
  async clear(projectId, endpointId, userId) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    const count = await DataModel.deleteByEndpointAll(endpointId);
    return { deleted: count };
  },

  // Count data for an endpoint
  async count(projectId, endpointId, userId) {
    // Check project and endpoint exist and user has access
    await ProjectService.getById(projectId, userId);
    await EndpointService.getById(endpointId, projectId);

    return await DataModel.countByEndpoint(endpointId);
  }
};