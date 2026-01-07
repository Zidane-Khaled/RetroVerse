import { WebSocketServer } from 'ws';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 8080;

// Create HTTP server
const httpServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('jsnes Multiplayer Relay Server\n');
});

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer });

// Track connected players
let players = {
  p1: null,
  p2: null
};

let inputSequence = 0;

console.log(`🎮 jsnes Multiplayer Server starting on ws://localhost:${PORT}`);

wss.on('connection', (ws) => {
  console.log('📱 Client connected');
  
  let assignedPlayerId = null;

  // Assign player ID (first = p1, second = p2)
  if (!players.p1) {
    assignedPlayerId = 'p1';
    players.p1 = ws;
    console.log('✓ Player 1 connected');
  } else if (!players.p2) {
    assignedPlayerId = 'p2';
    players.p2 = ws;
    console.log('✓ Player 2 connected');
    
    // Notify both players that game can start
    const startMessage = { type: 'start', playerId: 'p1', opponentReady: true };
    if (players.p1) {
      players.p1.send(JSON.stringify(startMessage));
    }
    const startMessage2 = { type: 'start', playerId: 'p2', opponentReady: true };
    ws.send(JSON.stringify(startMessage2));
    console.log('🚀 Both players ready - game started');
  } else {
    console.log('❌ Too many players, rejecting connection');
    ws.close(1008, 'Server full - 2 players max');
    return;
  }

  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data);

      if (message.type === 'input') {
        // Relay input to the other player
        const otherPlayerId = assignedPlayerId === 'p1' ? 'p2' : 'p1';
        const otherPlayer = players[otherPlayerId];

        if (otherPlayer && otherPlayer.readyState === WebSocketServer.OPEN) {
          // Relay the input packet
          const relayMessage = {
            type: 'input',
            packet: {
              ...message.packet,
              seq: inputSequence++
            }
          };
          otherPlayer.send(JSON.stringify(relayMessage));
          console.log(
            `📤 Relayed input: ${assignedPlayerId} → ${otherPlayerId} (frame ${message.packet.frame})`
          );
        }
      } else if (message.type === 'checkpoint') {
        // Relay checkpoint (for desync detection)
        const otherPlayerId = assignedPlayerId === 'p1' ? 'p2' : 'p1';
        const otherPlayer = players[otherPlayerId];

        if (otherPlayer && otherPlayer.readyState === WebSocketServer.OPEN) {
          otherPlayer.send(JSON.stringify({
            type: 'checkpoint',
            playerId: assignedPlayerId,
            checkpoint: message.checkpoint
          }));
          console.log(
            `✓ Checkpoint relayed: ${assignedPlayerId} → ${otherPlayerId} (frame ${message.checkpoint.frame})`
          );
        }
      } else if (message.type === 'ping') {
        // Echo pong for latency measurement
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('Error processing message:', err);
    }
  });

  // Handle client disconnect
  ws.on('close', () => {
    if (assignedPlayerId) {
      players[assignedPlayerId] = null;
      console.log(`❌ ${assignedPlayerId} disconnected`);

      // Notify other player
      const otherPlayerId = assignedPlayerId === 'p1' ? 'p2' : 'p1';
      const otherPlayer = players[otherPlayerId];
      if (otherPlayer && otherPlayer.readyState === WebSocketServer.OPEN) {
        otherPlayer.send(JSON.stringify({
          type: 'pause',
          reason: 'Opponent disconnected'
        }));
      }
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err.message);
  });
});

httpServer.listen(PORT, () => {
  console.log(`✅ Server listening on http://localhost:${PORT}`);
});
