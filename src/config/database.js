// src/config/database.js

import { MongoClient } from 'mongodb';
import { env } from './env.js';

let client = null;
let db = null;
let isReadOnly = false;

export async function connectToDatabase() {
  if (db && client) {
    return { db, client };
  }

  try {
    client = new MongoClient(env.MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 60000,
      connectTimeoutMS: 10000,
      serverSelectionTimeoutMS: 5000
    });

    await client.connect();
    db = client.db();

    // Test write permission
    try {
      await db.collection('_test').insertOne({ test: true });
      await db.collection('_test').deleteMany({ test: true });
      isReadOnly = false;
      console.log('✅ MongoDB connected with write permissions');
    } catch (writeError) {
      isReadOnly = true;
      console.warn('⚠️ MongoDB is in read-only mode. Some features will not work.');
    }

    console.log(`✅ MongoDB connected (${isReadOnly ? 'read-only' : 'read-write'})`);

    client.on('error', (error) => {
      console.error('❌ MongoDB connection error:', error);
    });

    client.on('close', () => {
      console.warn('⚠️ MongoDB connection closed');
    });

    return { db, client };
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

export function getDb() {
  if (!db) {
    throw new Error('Database not connected. Call connectToDatabase() first.');
  }
  return db;
}

export function getClient() {
  if (!client) {
    throw new Error('Database client not connected. Call connectToDatabase() first.');
  }
  return client;
}

export function isDatabaseReadOnly() {
  return isReadOnly;
}

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

export async function checkDatabaseHealth() {
  try {
    if (!db) return false;
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    return false;
  }
}

export async function createIndexes() {
  if (isReadOnly) {
    console.warn('⚠️ Skipping index creation (read-only mode)');
    return;
  }

  const database = getDb();

  try {
    await database.collection('users').createIndex(
      { email: 1 },
      { unique: true }
    );

    await database.collection('projects').createIndex(
      { userId: 1 }
    );
    await database.collection('projects').createIndex(
      { projectId: 1 },
      { unique: true }
    );
    await database.collection('projects').createIndex(
      { apiKey: 1 },
      { unique: true, sparse: true }
    );

    await database.collection('endpoints').createIndex(
      { projectId: 1, method: 1, path: 1 },
      { unique: true }
    );

    await database.collection('data').createIndex(
      { projectId: 1, endpointId: 1 }
    );
    await database.collection('data').createIndex(
      { projectId: 1, endpointId: 1, 'data.field': 1 },
      { sparse: true }
    );

    console.log('✅ Database indexes created');
  } catch (error) {
    console.error('❌ Failed to create indexes:', error.message);
  }
}