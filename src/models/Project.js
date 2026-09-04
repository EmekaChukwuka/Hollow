import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';
import { generateProjectId, generateApiKey } from '../utils/idGenerator.js';

const COLLECTION = 'projects';

export const ProjectModel = {
  // Get collection
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

  // Create a new project
  async create(userId, name, description = '') {
    const collection = this.getCollection();
    const now = new Date();

    const project = {
      userId: new ObjectId(userId),
      name: name.trim(),
      description: description.trim() || '',
      projectId: generateProjectId(),
      apiKey: generateApiKey(),
      requireApiKey: false,
      corsConfig: {
        allowedOrigins: ['*']
      },
      createdAt: now,
      updatedAt: now
    };

    const result = await collection.insertOne(project);
    return { ...project, _id: result.insertedId };
  },

  // Find project by ID
  async findById(id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id)
    });
  },

  // Find project by projectId (short ID)
  async findByProjectId(projectId) {
    const collection = this.getCollection();
    return await collection.findOne({
      projectId
    });
  },

  // Find project by API key
  async findByApiKey(apiKey) {
    const collection = this.getCollection();
    return await collection.findOne({
      apiKey
    });
  },

  // Find all projects for a user
  async findByUserId(userId) {
    const collection = this.getCollection();
    return await collection.find({
      userId: new ObjectId(userId)
    }).sort({ createdAt: -1 }).toArray();
  },

  // Update project
  async update(id, updates) {
    const collection = this.getCollection();
    const now = new Date();

    // Remove fields that shouldn't be updated directly
    const allowedUpdates = {
      name: updates.name,
      description: updates.description,
      requireApiKey: updates.requireApiKey,
      corsConfig: updates.corsConfig
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

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

  // Regenerate API key
  async regenerateApiKey(id) {
    const collection = this.getCollection();
    const now = new Date();
    const newApiKey = generateApiKey();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          apiKey: newApiKey,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  },

  // Delete project
  async delete(id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  },

  // Check if project belongs to user
  async belongsToUser(projectId, userId) {
    const collection = this.getCollection();
    const project = await collection.findOne({
      _id: new ObjectId(projectId),
      userId: new ObjectId(userId)
    });
    return !!project;
  },

  // Validate API key for a project
  async validateApiKey(projectId, apiKey) {
    const collection = this.getCollection();
    const project = await collection.findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) return false;
    if (!project.requireApiKey) return true;
    if (!apiKey) return false;

    return project.apiKey === apiKey;
  },

  // Get project with endpoints count
  async getProjectWithStats(projectId) {
    const collection = this.getCollection();
    const db = getDb();

    const project = await collection.findOne({
      _id: new ObjectId(projectId)
    });

    if (!project) return null;

    const endpointCount = await db.collection('endpoints').countDocuments({
      projectId: new ObjectId(projectId)
    });

    const dataCount = await db.collection('data').countDocuments({
      projectId: new ObjectId(projectId)
    });

    return {
      ...project,
      stats: {
        endpoints: endpointCount,
        records: dataCount
      }
    };
  }
};