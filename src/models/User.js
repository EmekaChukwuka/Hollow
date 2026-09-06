// src/models/User.js
import { ObjectId } from 'mongodb';
import { getDb } from '../config/database.js';

const COLLECTION = 'users';

export const UserModel = {
  getCollection() {
    const db = getDb();
    return db.collection(COLLECTION);
  },

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

    const result = await collection.insertOne(user);
    return { ...user, _id: result.insertedId };
  },
async findByEmail(email) {
  const collection = this.getCollection();

  console.log('🔎 Searching users collection');
  console.log('📧 Email:', email.toLowerCase().trim());
  console.log('📁 Collection:', collection.collectionName);
  console.log('🗄️ Database:', collection.dbName);

  const user = await collection.findOne({
    email: email.toLowerCase().trim()
  });

  console.log('👤 Found user:', user);

  return user;
},

  async findById(id) {
    const collection = this.getCollection();
    return await collection.findOne({
      _id: new ObjectId(id)
    });
  },

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

  async delete(id) {
    const collection = this.getCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(id)
    });
    return result.deletedCount > 0;
  },

  toJSON(user) {
    if (!user) return null;
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
};