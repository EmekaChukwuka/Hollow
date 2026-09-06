// src/models/User.js
import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';
import bcrypt from 'bcryptjs';

const COLLECTION = 'users';
const SALT_ROUNDS = 10;

export const UserModel = {
  // Get collection
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

  // Create a new user (using bcryptjs)
  async create(userData) {
    const collection = this.getCollection();
    const now = new Date();

    // Hash password if provided
    let passwordHash = null;
    if (userData.password) {
      passwordHash = await bcrypt.hash(userData.password, SALT_ROUNDS);
    } else if (userData.passwordHash) {
      passwordHash = userData.passwordHash;
    }

    const user = {
      email: userData.email.toLowerCase().trim(),
      passwordHash: passwordHash,
      name: userData.name || '',
      provider: userData.provider || 'email',
      verified: userData.verified || false,
      avatar: userData.avatar || null,
      createdAt: now,
      updatedAt: now
    };

    try {
      const result = await collection.insertOne(user);
      return { 
        id: result.insertedId.toString(),
        ...user, 
        _id: result.insertedId 
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      if (error.code === 13 || error.message?.includes('not authorized')) {
        throw new Error('Database is in read-only mode. Please check your MongoDB connection string.');
      }
      throw error;
    }
  },

  // Find user by email
  async findByEmail(email) {
    const collection = this.getCollection();
    const user = await collection.findOne({
      email: email.toLowerCase().trim()
    });
    
    if (user) {
      // Convert _id to id for consistency with the working code
      user.id = user._id.toString();
    }
    return user;
  },

  // Find user by ID
  async findById(id) {
    const collection = this.getCollection();
    const user = await collection.findOne({
      _id: new ObjectId(id)
    });
    
    if (user) {
      user.id = user._id.toString();
    }
    return user;
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

    if (result.value) {
      result.value.id = result.value._id.toString();
    }
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

  // Compare password (static method for login)
  async comparePassword(email, password) {
    const user = await this.findByEmail(email);
    if (!user || !user.passwordHash) return false;
    return await bcrypt.compare(password, user.passwordHash);
  },

  // Remove sensitive data from user object (for API responses)
  toJSON(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
};