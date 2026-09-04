import { ProjectModel } from '../models/Project.js';
import { EndpointModel } from '../models/Endpoint.js';
import { DataModel } from '../models/Data.js';
import { AppError, NotFoundError, ValidationError } from '../middleware/errorHandler.js';

export const ProjectService = {
  // Create a new project
  async create(userId, name, description = '') {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('Project name is required');
    }

    return await ProjectModel.create(userId, name, description);
  },

  // Get project by ID
  async getById(projectId, userId = null) {
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // If userId provided, check ownership
    if (userId && project.userId.toString() !== userId.toString()) {
      throw new AppError('You do not have access to this project', 403);
    }

    return project;
  },

  // Get project by short ID (projectId)
  async getByProjectId(projectId) {
    const project = await ProjectModel.findByProjectId(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  },

  // Get all projects for a user
  async getByUser(userId) {
    return await ProjectModel.findByUserId(userId);
  },

  // Update project
  async update(projectId, userId, updates) {
    // Check ownership
    const project = await this.getById(projectId, userId);

    // Validate inputs
    if (updates.name !== undefined && !updates.name.trim()) {
      throw new ValidationError('Project name cannot be empty');
    }

    const updated = await ProjectModel.update(projectId, updates);
    return updated;
  },

  // Delete project (cascade delete endpoints and data)
  async delete(projectId, userId) {
    // Check ownership
    await this.getById(projectId, userId);

    // Delete all endpoints for this project
    const endpoints = await EndpointModel.findByProject(projectId);
    for (const endpoint of endpoints) {
      await EndpointModel.delete(endpoint._id);
    }

    // Delete all data for this project
    await DataModel.deleteByProject(projectId);

    // Delete the project
    const deleted = await ProjectModel.delete(projectId);
    return deleted;
  },

  // Regenerate API key
  async regenerateApiKey(projectId, userId) {
    // Check ownership
    await this.getById(projectId, userId);

    const project = await ProjectModel.regenerateApiKey(projectId);
    return project.apiKey;
  },

  // Get project with stats
  async getProjectWithStats(projectId) {
    const project = await ProjectModel.getProjectWithStats(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  },

  // Validate API key
  async validateApiKey(projectId, apiKey) {
    return await ProjectModel.validateApiKey(projectId, apiKey);
  },

  // Check if project belongs to user
  async belongsToUser(projectId, userId) {
    return await ProjectModel.belongsToUser(projectId, userId);
  }
};