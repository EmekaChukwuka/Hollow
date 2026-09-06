// src/models/User.js
import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';

const COLLECTION = 'users';

export const UserModel = {
  // Get collection - THIS WAS MISSING
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

  // Create a new user
  async create(userData) {
    const collection = this.getCollection();
    const now = new Date();

    const user = {
      email: userData.email.toLowerCase().trim(),
      passwordHash: userData.passwordHash,
      name: userData.name || '',
      createdAt: now,
      updatedAt: now
    };

    try {
      const result = await collection.insertOne(user);
      return { ...user, _id: result.insertedId };
    } catch (error) {
      if (error.code === 13 || error.message?.includes('not authorized')) {
        throw new Error('Database is in read-only mode. Please check your MongoDB connection string.');
      }
      throw error;
    }
  },

  // Find user by email
  async findByEmail(email) {
    const collection = this.getCollection();
    return await collection.findOne({
      email: email.toLowerCase().trim()
    });
  },

  // Find user by ID
  async findById(id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id)
    });
  },

  // Update user
  async update(id, updates) {
    const collection = this.getCollection();
    const now = new Date();

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    return result.value;
  },

  // Delete user
  async delete(id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  },

  // Check if email exists
  async emailExists(email) {
    const collection = this.getCollection();
    const count = await collection.countDocuments({
      email: email.toLowerCase().trim()
    });
    return count > 0;
  },

  // Remove sensitive data from user object (for API responses)
  toJSON(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
};