import http from 'http';
import app from './app';
import { connectDB } from './config/db';
import { socketManager } from './sockets/socketManager';
import { startWorker } from './workers/generationWorker';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. Connect to database
  await connectDB();

  // 2. Create HTTP server
  const server = http.createServer(app);

  // 3. Initialize WebSocket server with SocketManager
  socketManager.init(server);
  console.log('WebSocket Server bound successfully to /ws');

  // 4. Initialize background BullMQ workers
  startWorker();
  console.log('BullMQ Workers spawned and listening for generation jobs...');

  // 5. Start Server listening
  server.listen(PORT, () => {
    console.log(`VedaAI Assessment Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch((err) => {
  console.error('Critical failure during server startup:', err);
  process.exit(1);
});
