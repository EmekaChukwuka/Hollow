import { MongoClient } from 'mongodb';
import { env } from './env.js';

let client = null;
let db = null;

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

    console.log(`✅ MongoDB connected successfully`);

    // Handle connection errors after initial connection
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

export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
}

// Health check
export async function checkDatabaseHealth() {
  try {
    if (!db) return false;
    await db.command({ ping: 1 });
    return true;
  } catch (error) {
    return false;
  }
}

// Create indexes
export async function createIndexes() {
  const database = getDb();

  // Users
  await database.collection('users').createIndex(
    { email: 1 },
    { unique: true }
  );

  // Projects
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

  // Endpoints
  await database.collection('endpoints').createIndex(
    { projectId: 1, method: 1, path: 1 },
    { unique: true }
  );

  // Data
  await database.collection('data').createIndex(
    { projectId: 1, endpointId: 1 }
  );
  await database.collection('data').createIndex(
    { projectId: 1, endpointId: 1, 'data.field': 1 },
    { sparse: true }
  );

  console.log('✅ Database indexes created');
}