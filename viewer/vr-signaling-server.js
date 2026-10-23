/**
 * VR Signaling Server for Floor Plan Viewer
 * Handles WebRTC signaling and ngrok tunnel integration
 */

const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve static files from viewer directory
app.use(express.static(__dirname));

// Store active VR sessions
const sessions = new Map();

// Ngrok process
let ngrokProcess = null;
let ngrokUrl = null;

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('📱 New WebSocket connection');
  
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
          
        case 'request-ngrok-url':
          sendNgrokUrl(ws);
          break;
          
        default:
          console.log('❓ Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Message parsing error:', error);
    }
  });

  ws.on('close', () => {
    console.log(`🔌 WebSocket closed - Role: ${deviceRole}, Session: ${currentSession}`);
    if (currentSession && sessions.has(currentSession)) {
      const session = sessions.get(currentSession);
      
      if (deviceRole === 'primary') {
        if (session.secondary && session.secondary.readyState === WebSocket.OPEN) {
          session.secondary.send(JSON.stringify({ type: 'primary-disconnected' }));
        }
        sessions.delete(currentSession);
      } else if (deviceRole === 'secondary') {
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

    console.log(`✅ Registering ${role} device for session ${sessionId}`);

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
      
      if (session.primary && session.primary.readyState === WebSocket.OPEN) {
        session.primary.send(JSON.stringify({ type: 'secondary-connected' }));
      }
      
      ws.send(JSON.stringify({ type: 'primary-ready' }));
    }
  }

  function forwardSignaling(data) {
    const { sessionId } = data;
    if (!sessions.has(sessionId)) {
      console.error('❌ Session not found:', sessionId);
      return;
    }

    const session = sessions.get(sessionId);
    const target = deviceRole === 'primary' ? session.secondary : session.primary;

    if (target && target.readyState === WebSocket.OPEN) {
      target.send(JSON.stringify(data));
    } else {
      console.error('❌ Target device not connected');
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
  
  function sendNgrokUrl(ws) {
    if (ngrokUrl) {
      ws.send(JSON.stringify({ 
        type: 'ngrok-url', 
        url: ngrokUrl 
      }));
    } else {
      ws.send(JSON.stringify({ 
        type: 'ngrok-error', 
        message: 'Ngrok not available' 
      }));
    }
  }
});

// Clean up old sessions (older than 2 hours)
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > 7200000) {
      console.log(`🧹 Cleaning up old session: ${sessionId}`);
      sessions.delete(sessionId);
    }
  }
}, 600000); // Check every 10 minutes

// HTTP API endpoints
app.get('/api/sessions', (req, res) => {
  const activeSessions = Array.from(sessions.entries()).map(([id, session]) => ({
    id,
    hasPrimary: !!session.primary,
    hasSecondary: !!session.secondary,
    createdAt: new Date(session.createdAt).toISOString()
  }));
  res.json({ sessions: activeSessions, count: activeSessions.length });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    connections: wss.clients.size,
    sessions: sessions.size,
    ngrokUrl: ngrokUrl || 'not available'
  });
});

app.get('/api/ngrok-url', (req, res) => {
  if (ngrokUrl) {
    res.json({ url: ngrokUrl });
  } else {
    res.status(503).json({ error: 'Ngrok not available' });
  }
});

// Start ngrok tunnel
function startNgrok(port) {
  return new Promise((resolve, reject) => {
    console.log('🚇 Starting ngrok tunnel...');
    
    // Try to use ngrok command
    ngrokProcess = spawn('ngrok', ['http', port.toString(), '--log=stdout']);
    
    let urlFound = false;
    
    ngrokProcess.stdout.on('data', (data) => {
      const output = data.toString();
      console.log('[ngrok]', output.trim());
      
      // Parse ngrok URL from output
      const urlMatch = output.match(/url=(https:\/\/[^\s]+)/i) || 
                      output.match(/(https:\/\/[a-z0-9-]+\.ngrok-free\.app)/i);
      
      if (urlMatch && !urlFound) {
        urlFound = true;
        ngrokUrl = urlMatch[1];
        console.log('✅ Ngrok tunnel established:', ngrokUrl);
        resolve(ngrokUrl);
      }
    });
    
    ngrokProcess.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('[ngrok error]', error.trim());
    });
    
    ngrokProcess.on('error', (error) => {
      console.error('❌ Failed to start ngrok:', error.message);
      console.log('💡 Make sure ngrok is installed: https://ngrok.com/download');
      reject(error);
    });
    
    ngrokProcess.on('close', (code) => {
      console.log(`🔌 Ngrok process exited with code ${code}`);
      ngrokUrl = null;
      ngrokProcess = null;
    });
    
    // Timeout after 10 seconds if URL not found
    setTimeout(() => {
      if (!urlFound) {
        console.log('⚠️  Ngrok URL not detected, server will run in local-only mode');
        resolve(null);
      }
    }, 10000);
  });
}

// Start server
const PORT = process.env.PORT || 3001;

async function startServer() {
  // Start HTTP server
  server.listen(PORT, () => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║   Floor Plan VR Sharing Server                            ║');
    console.log('╚═══════════════════════════════════════════════════════════╝');
    console.log('');
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
    console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    console.log('');
    console.log('📊 API Endpoints:');
    console.log(`   Health: http://localhost:${PORT}/api/health`);
    console.log(`   Sessions: http://localhost:${PORT}/api/sessions`);
    console.log(`   Ngrok URL: http://localhost:${PORT}/api/ngrok-url`);
    console.log('');
  });
  
  // Try to start ngrok
  try {
    const url = await startNgrok(PORT);
    if (url) {
      console.log('');
      console.log('╔═══════════════════════════════════════════════════════════╗');
      console.log('║   🌐 PUBLIC URL (Share this with mobile devices)          ║');
      console.log('╚═══════════════════════════════════════════════════════════╝');
      console.log('');
      console.log(`   ${url}`);
      console.log('');
      console.log('📱 Mobile VR URL will be generated from this base URL');
      console.log('');
    }
  } catch (error) {
    console.log('');
    console.log('⚠️  Running in LOCAL-ONLY mode');
    console.log('💡 To enable remote access:');
    console.log('   1. Install ngrok: https://ngrok.com/download');
    console.log('   2. Restart this server');
    console.log('');
  }
  
  console.log('Press Ctrl+C to stop');
  console.log('═══════════════════════════════════════════════════════════');
}

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.send(JSON.stringify({ type: 'server-shutdown' }));
    client.close();
  });
  
  // Close ngrok tunnel
  if (ngrokProcess) {
    console.log('🔌 Closing ngrok tunnel...');
    ngrokProcess.kill();
  }
  
  // Close HTTP server
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
  
  // Force exit after 5 seconds
  setTimeout(() => {
    console.log('⏱️  Force closing...');
    process.exit(1);
  }, 5000);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled rejection:', reason);
});

module.exports = { server, wss, sessions };
