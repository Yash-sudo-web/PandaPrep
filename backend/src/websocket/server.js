// File: websocket/server.js
import { WebSocketServer } from 'ws';
import http from 'http';
import { v4 as uuidv4 } from 'uuid';

// Map to store active connections by requestId
const activeConnections = new Map();

// Initialize WebSocket server
export function initializeWebSocketServer(server) {
  const wss = new WebSocketServer({ server });
  
  wss.on('connection', (ws, req) => {
    // Extract requestId from URL query params
    const url = new URL(req.url, `http://${req.headers.host}`);
    const requestId = url.searchParams.get('requestId');
    
    if (!requestId) {
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'No requestId provided' 
      }));
      ws.close();
      return;
    }
    
    console.log(`[WebSocket] Client connected for request: ${requestId}`);
    
    // Store the connection with the requestId
    if (!activeConnections.has(requestId)) {
      activeConnections.set(requestId, []);
    }
    activeConnections.get(requestId).push(ws);
    
    // Send initial connection confirmation
    ws.send(JSON.stringify({ 
      type: 'connected', 
      requestId, 
      message: 'WebSocket connection established' 
    }));
    
    // Handle connection close
    ws.on('close', () => {
      console.log(`[WebSocket] Client disconnected from request: ${requestId}`);
      const connections = activeConnections.get(requestId);
      if (connections) {
        const index = connections.indexOf(ws);
        if (index !== -1) {
          connections.splice(index, 1);
        }
        if (connections.length === 0) {
          activeConnections.delete(requestId);
        }
      }
    });
    
    // We could handle messages from client here if needed
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log(`[WebSocket] Received message from ${requestId}:`, data);
        
        // Handle any client messages if needed
      } catch (error) {
        console.error(`[WebSocket] Error processing message: ${error.message}`);
      }
    });
  });
  
  return wss;
}

// Function to broadcast updates to all clients for a specific requestId
export function broadcastUpdate(requestId, data) {
  if (!activeConnections.has(requestId)) {
    console.log(`[WebSocket] No active connections for request: ${requestId}`);
    return false;
  }
  
  const connections = activeConnections.get(requestId);
  connections.forEach(client => {
    if (client.readyState === 1) { // 1 = OPEN
      client.send(JSON.stringify(data));
    }
  });
  
  return true;
}

export function createRequestId() {
  return uuidv4();
}

// Broadcast a specific stage of the generation process
export function broadcastStage(requestId, stage, data = {}, progress = null) {
  return broadcastUpdate(requestId, {
    type: 'stage_update',
    stage,
    data,
    progress,
    timestamp: Date.now()
  });
}

// Broadcast markdown content updates
export function broadcastMarkdownUpdate(requestId, content, sectionIndex = null, isComplete = false) {
  return broadcastUpdate(requestId, {
    type: 'content_update',
    content,
    sectionIndex,
    isComplete,
    timestamp: Date.now()
  });
}

// Broadcast error messages
export function broadcastError(requestId, message, details = null) {
  return broadcastUpdate(requestId, {
    type: 'error',
    message,
    details,
    timestamp: Date.now()
  });
}