import mongoose from 'mongoose';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/veda-assessment';

// In serverless environments, connections must be cached across invocations
// to avoid creating a new connection on every request.
let cached = (global as any)._mongooseCache as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = (global as any)._mongooseCache = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGO_URI).then((m) => {
      console.log('[Serverless DB] Connected to MongoDB.');
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
