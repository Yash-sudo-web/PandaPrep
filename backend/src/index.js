import dotenv from 'dotenv';
import http from 'http';
import connectDB from './db/index.js';
import { app } from './app.js';
import { initializeWebSocketServer } from './websocket/server.js';
import { deleteOldPDFsFromCloudinary } from './utils/cloudinary-file-upload.util.js';
import cron from 'node-cron';

dotenv.config({
  path: './.env',
});

// Create HTTP server from Express app
const server = http.createServer(app);

// Initialize WebSocket server with the HTTP server
const wss = initializeWebSocketServer(server);

cron.schedule("0 0 * * *", async () => {
  console.log("Running scheduled cleanup of old PDFs...");
  await deleteOldPDFsFromCloudinary();
});

connectDB()
  .then(() => {
    // Listen on the HTTP server instead of the Express app directly
    server.listen(process.env.PORT || 8000, () => {
      console.log(`Server is running at port: ${process.env.PORT || 8000}`);
      console.log(`http://localhost:${process.env.PORT || 8000}`);
      console.log(`WebSocket server initialized`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection failed!', err);
  });
