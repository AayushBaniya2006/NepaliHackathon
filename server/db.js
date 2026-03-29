import { MongoClient } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/';
const DB_NAME = process.env.MONGODB_PATIENTS_DB || 'voicecanvas_patients';

const client = new MongoClient(MONGODB_URI);

let db;

export async function connectDB() {
  if (db) return db;
  await client.connect();
  db = client.db(DB_NAME);

  // Create indexes
  await db.collection('users').createIndex({ id: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ id: 1 }, { unique: true });
  await db.collection('sessions').createIndex({ user_id: 1 });
  await db.collection('sessions').createIndex({ created_at: -1 });
  await db.collection('analytics').createIndex({ user_id: 1 });
  await db.collection('session_strokes').createIndex({ session_id: 1 });

  console.log(`Connected to MongoDB: ${DB_NAME}`);
  return db;
}

export function getDB() {
  if (!db) throw new Error('Database not connected. Call connectDB() first.');
  return db;
}

export default { connectDB, getDB };
