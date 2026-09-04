import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';

const COLLECTION = 'data';

export const DataModel = {
  // Get collection
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

  // Create a new data document
  async create(projectId, endpointId, data) {
    const collection = this.getCollection();
    const now = new Date();

    const doc = {
      projectId: new ObjectId(projectId),
      endpointId: new ObjectId(endpointId),
      data: data,
      _createdAt: now,
      _updatedAt: now
    };

    const result = await collection.insertOne(doc);
    return { ...doc, _id: result.insertedId };
  },

  // Find all data for an endpoint with pagination and filtering
  async findByEndpoint(endpointId, query = {}) {
    const collection = this.getCollection();

    const filter = {
      endpointId: new ObjectId(endpointId)
    };

    // Parse filter from query string (simple key-value)
    if (query.filter) {
      try {
        const parsedFilter = JSON.parse(query.filter);
        Object.assign(filter, parsedFilter);
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    // Build sort
    let sort = { _createdAt: -1 };
    if (query.sort) {
      try {
        const parsedSort = JSON.parse(query.sort);
        sort = parsedSort;
      } catch (e) {
        // Ignore invalid JSON
      }
    }

    // Pagination
    const limit = Math.min(
      parseInt(query.limit) || 50,
      100
    );
    const skip = parseInt(query.skip) || 0;

    const items = await collection.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments(filter);

    return { items, total, limit, skip };
  },

  // Find all data for a project
  async findByProject(projectId) {
    const collection = this.getCollection();
    return await collection.find({
      projectId: new ObjectId(projectId)
    }).sort({ _createdAt: -1 }).toArray();
  },

  // Find single data document by ID
  async findById(id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id)
    });
  },

  // Find single data document by endpoint ID and data ID
  async findOneByEndpoint(endpointId, id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id),
      endpointId: new ObjectId(endpointId)
    });
  },

  // Update a data document
  async update(id, data) {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          data: data,
          _updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  },

  // Update a data document by endpoint ID and data ID
  async updateByEndpoint(endpointId, id, data) {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      {
        _id: new ObjectId(id),
        endpointId: new ObjectId(endpointId)
      },
      {
        $set: {
          data: data,
          _updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  },

  // Delete a data document
  async delete(id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  },

  // Delete a data document by endpoint ID and data ID
  async deleteByEndpoint(endpointId, id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id),
      endpointId: new ObjectId(endpointId)
    });
    return result.deletedCount > 0;
  },

  // Delete all data for an endpoint
  async deleteByEndpointAll(endpointId) {
    const collection = this.getCollection();
    const result = await collection.deleteMany({
      endpointId: new ObjectId(endpointId)
    });
    return result.deletedCount;
  },

  // Delete all data for a project
  async deleteByProject(projectId) {
    const collection = this.getCollection();
    const result = await collection.deleteMany({
      projectId: new ObjectId(projectId)
    });
    return result.deletedCount;
  },

  // Count data for an endpoint
  async countByEndpoint(endpointId) {
    const collection = this.getCollection();
    return await collection.countDocuments({
      endpointId: new ObjectId(endpointId)
    });
  },

  // Count data for a project
  async countByProject(projectId) {
    const collection = this.getCollection();
    return await collection.countDocuments({
      projectId: new ObjectId(projectId)
    });
  },

  // Check if data exists for a specific ID
  async exists(id) {
    const collection = this.getCollection();
    const count = await collection.countDocuments({
      _id: new ObjectId(id)
    });
    return count > 0;
  },

  // Check if data belongs to endpoint
  async belongsToEndpoint(dataId, endpointId) {
    const collection = this.getCollection();
    const count = await collection.countDocuments({
      _id: new ObjectId(dataId),
      endpointId: new ObjectId(endpointId)
    });
    return count > 0;
  }
};