/**
 * WebSocket Signaling Server for VR Mode
 * 
 * Handles WebRTC signaling between primary and secondary devices
 * Enables real-time screen streaming and sensor data exchange
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files
app.use(express.static(path.join(__dirname)));

// Store active sessions
const sessions = new Map();

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');
  
  let currentSession = null;
  let deviceRole = null;

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      switch (data.type) {
        case 'register':
          handleRegister(ws, data);
          break;
          
        case 'offer':
        case 'answer':
        case 'ice-candidate':
          forwardSignaling(data);
          break;
          
        case 'head-movement':
          forwardHeadMovement(data);
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('Message parsing error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`WebSocket closed - Role: ${deviceRole}, Session: ${currentSession}`);
    if (currentSession && sessions.has(currentSession)) {
      const session = sessions.get(currentSession);
      
      if (deviceRole === 'primary') {
        // Notify secondary that primary disconnected
        if (session.secondary && session.secondary.readyState === WebSocket.OPEN) {
          session.secondary.send(JSON.stringify({ type: 'primary-disconnected' }));
        }
        sessions.delete(currentSession);
      } else if (deviceRole === 'secondary') {
        // Notify primary that secondary disconnected
        if (session.primary && session.primary.readyState === WebSocket.OPEN) {
          session.primary.send(JSON.stringify({ type: 'secondary-disconnected' }));
        }
        session.secondary = null;
      }
    }
  });

  function handleRegister(ws, data) {
    const { role, sessionId } = data;
    deviceRole = role;
    currentSession = sessionId;

    console.log(`Registering ${role} device for session ${sessionId}`);

    if (!sessions.has(sessionId)) {
      sessions.set(sessionId, {
        primary: null,
        secondary: null,
        createdAt: Date.now()
      });
    }

    const session = sessions.get(sessionId);

    if (role === 'primary') {
      session.primary = ws;
      ws.send(JSON.stringify({ type: 'registered', role: 'primary' }));
    } else if (role === 'secondary') {
      session.secondary = ws;
      ws.send(JSON.stringify({ type: 'registered', role: 'secondary' }));
      
      // Notify primary that secondary connected
      if (session.primary && session.primary.readyState === WebSocket.OPEN) {
        session.primary.send(JSON.stringify({ type: 'secondary-connected' }));
      }
      
      // Notify secondary that primary is ready
      ws.send(JSON.stringify({ type: 'primary-ready' }));
    }
  }

  function forwardSignaling(data) {
    const { sessionId } = data;
    if (!sessions.has(sessionId)) {
      console.error('Session not found:', sessionId);
      return;
    }

    const session = sessions.get(sessionId);
    const target = deviceRole === 'primary' ? session.secondary : session.primary;

    if (target && target.readyState === WebSocket.OPEN) {
      target.send(JSON.stringify(data));
    } else {
      console.error('Target device not connected');
    }
  }

  function forwardHeadMovement(data) {
    const { sessionId } = data;
    if (!sessions.has(sessionId)) return;

    const session = sessions.get(sessionId);
    if (session.primary && session.primary.readyState === WebSocket.OPEN) {
      session.primary.send(JSON.stringify(data));
    }
  }
});

// Clean up old sessions (older than 1 hour)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > 3600000) {
      console.log(`Cleaning up old session: ${sessionId}`);
      sessions.delete(sessionId);
    }
  }
}, 300000); // Check every 5 minutes

// HTTP endpoints
app.get('/sessions', (req, res) => {
  const activeSessions = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    hasPrimary: !!session.primary,
    hasSecondary: !!session.secondary,
    createdAt: session.createdAt
  }));
  res.json(activeSessions);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: wss.clients.size,
    sessions: sessions.size 
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   VR Mode Signaling Server                     ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('');
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('');
  console.log('📱 Open primary device at:');
  console.log(`   http://localhost:${PORT}/vr-primary.html`);
  console.log('');
  console.log('📊 Health check: http://localhost:${PORT}/health');
  console.log('📋 Active sessions: http://localhost:${PORT}/sessions');
  console.log('');
  console.log('Press Ctrl+C to stop');
  console.log('════════════════════════════════════════════════');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  wss.clients.forEach(client => client.close());
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
