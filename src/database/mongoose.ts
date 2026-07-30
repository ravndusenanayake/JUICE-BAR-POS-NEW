import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = (global as any).__mongoMemoryServer || null;
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    const uri = process.env.MONGODB_URI;

    cached.promise = (async () => {
      if (uri) {
        try {
          const conn = await mongoose.connect(uri, { ...opts, serverSelectionTimeoutMS: 2500 });
          return conn;
        } catch (err) {
          console.warn('Could not connect to MONGODB_URI, spinning up MongoMemoryServer:', (err as Error).message);
        }
      }

      if (!mongoMemoryServer) {
        mongoMemoryServer = await MongoMemoryServer.create();
        (global as any).__mongoMemoryServer = mongoMemoryServer;
      }
      const memUri = mongoMemoryServer.getUri();
      console.log('Connected to In-Memory MongoDB instance:', memUri);
      return await mongoose.connect(memUri, opts);
    })();
  }
  
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;

