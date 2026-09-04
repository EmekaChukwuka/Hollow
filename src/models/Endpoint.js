import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';
import { matchPath } from '../utils/pathMatcher.js';
import { constants } from '../config/constants.js';

const COLLECTION = 'endpoints';

export const EndpointModel = {
  // Get collection
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

  // Create a new endpoint
  async create(projectId, endpointData) {
    const collection = this.getCollection();
    const now = new Date();

    const endpoint = {
      projectId: new ObjectId(projectId),
      method: endpointData.method.toUpperCase(),
      path: endpointData.path.trim(),
      mode: endpointData.mode || 'static',
      description: endpointData.description || '',
      responses: endpointData.responses || [],
      schema: endpointData.schema || { fields: {} },
      createdAt: now,
      updatedAt: now
    };

    // Validate mode
    if (!constants.ENDPOINT_MODES.includes(endpoint.mode)) {
      throw new Error(`Invalid mode: ${endpoint.mode}`);
    }

    // Validate method
    if (!constants.HTTP_METHODS.includes(endpoint.method)) {
      throw new Error(`Invalid method: ${endpoint.method}`);
    }

    const result = await collection.insertOne(endpoint);
    return { ...endpoint, _id: result.insertedId };
  },

  // Find endpoint by ID
  async findById(id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id)
    });
  },

  // Find all endpoints for a project
  async findByProject(projectId) {
    const collection = this.getCollection();
    return await collection.find({
      projectId: new ObjectId(projectId)
    }).sort({ createdAt: 1 }).toArray();
  },

  // Find endpoint by project, method, and path (exact match)
  async findExactMatch(projectId, method, path) {
    const collection = this.getCollection();
    return await collection.findOne({
      projectId: new ObjectId(projectId),
      method: method.toUpperCase(),
      path: path.trim()
    });
  },

  // Find endpoint by matching path pattern (with path parameters)
  async findPathMatch(projectId, method, path) {
    const collection = this.getCollection();
    const allEndpoints = await collection.find({
      projectId: new ObjectId(projectId),
      method: method.toUpperCase()
    }).toArray();

    for (const endpoint of allEndpoints) {
      const match = matchPath(endpoint.path, path);
      if (match) {
        return {
          endpoint,
          params: match
        };
      }
    }

    return null;
  },

  // Find endpoint (exact match first, then path parameter match)
  async findMatch(projectId, method, path) {
    // Try exact match first
    const exact = await this.findExactMatch(projectId, method, path);
    if (exact) {
      return { endpoint: exact, params: null };
    }

    // Try path parameter match
    return await this.findPathMatch(projectId, method, path);
  },

  // Update endpoint
  async update(id, updates) {
    const collection = this.getCollection();
    const now = new Date();

    // Only allow specific fields to be updated
    const allowedUpdates = {
      method: updates.method,
      path: updates.path,
      mode: updates.mode,
      description: updates.description,
      responses: updates.responses,
      schema: updates.schema
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    // Validate method if provided
    if (allowedUpdates.method && !constants.HTTP_METHODS.includes(allowedUpdates.method)) {
      throw new Error(`Invalid method: ${allowedUpdates.method}`);
    }

    // Validate mode if provided
    if (allowedUpdates.mode && !constants.ENDPOINT_MODES.includes(allowedUpdates.mode)) {
      throw new Error(`Invalid mode: ${allowedUpdates.mode}`);
    }

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...allowedUpdates,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  },

  // Delete endpoint
  async delete(id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  },

  // Delete all endpoints for a project
  async deleteByProject(projectId) {
    const collection = this.getCollection();
    const result = await collection.deleteMany({
      projectId: new ObjectId(projectId)
    });
    return result.deletedCount;
  },

  // Check if endpoint belongs to project
  async belongsToProject(endpointId, projectId) {
    const collection = this.getCollection();
    const endpoint = await collection.findOne({
      _id: new ObjectId(endpointId),
      projectId: new ObjectId(projectId)
    });
    return !!endpoint;
  },

  // Check if endpoint path exists for project (excluding a specific endpoint ID)
  async pathExists(projectId, method, path, excludeId = null) {
    const collection = this.getCollection();
    const query = {
      projectId: new ObjectId(projectId),
      method: method.toUpperCase(),
      path: path.trim()
    };

    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const count = await collection.countDocuments(query);
    return count > 0;
  },

  // Get default response for static endpoint
  getDefaultResponse(endpoint) {
    if (endpoint.mode !== 'static') return null;
    return endpoint.responses?.find(r => r.isDefault) || endpoint.responses?.[0] || null;
  },

  // Validate endpoint data before saving
  validateEndpointData(data) {
    const errors = [];

    if (!data.method) {
      errors.push('Method is required');
    } else if (!constants.HTTP_METHODS.includes(data.method.toUpperCase())) {
      errors.push(`Invalid method: ${data.method}`);
    }

    if (!data.path) {
      errors.push('Path is required');
    } else if (!data.path.startsWith('/')) {
      errors.push('Path must start with /');
    }

    if (data.mode && !constants.ENDPOINT_MODES.includes(data.mode)) {
      errors.push(`Invalid mode: ${data.mode}`);
    }

    if (data.mode === 'static' && data.responses) {
      const defaultResponses = data.responses.filter(r => r.isDefault);
      if (defaultResponses.length > 1) {
        errors.push('Only one response can be set as default');
      }
      if (defaultResponses.length === 0 && data.responses.length > 0) {
        errors.push('At least one response must be set as default');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};