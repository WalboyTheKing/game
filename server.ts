import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const HOST = '0.0.0.0';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(express.json());

// API health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// -------------------------------------------------------------
// REAL-TIME MULTIPLAYER ROOMS & AUTHORITATIVE PHYSICS ENGINE
// -------------------------------------------------------------

interface RoomPlayer {
  id: string;
  username: string;
  avatar: string;
  role: 'player1' | 'player2';
  ready: boolean;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  vx: number;
  vy: number;
}

interface Room {
  id: string;
  gameType: 'pong' | 'hockey';
  name: string;
  hostId: string;
  maxScore: number;
  players: Record<string, RoomPlayer>; // key is socket id
  spectators: string[];
  status: 'waiting' | 'countdown' | 'playing' | 'gameover';
  countdown: number;
  winner?: 'player1' | 'player2';
  winnerName?: string;
  score1: number;
  score2: number;
  ball: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    speed: number;
    radius: number;
  };
  lastTouch?: 'player1' | 'player2';
  lastActive: number;
}

const rooms: Map<string, Room> = new Map();
const socketToRoom: Map<WebSocket, { roomId: string; playerId: string }> = new Map();

const TABLE_WIDTH = 800;
const TABLE_HEIGHT = 500;
const GOAL_TOP = 170;
const GOAL_BOTTOM = 330;

function resetPuck(room: Room, direction: 'left' | 'right' | 'random' = 'random') {
  room.ball.x = TABLE_WIDTH / 2;
  room.ball.y = TABLE_HEIGHT / 2;
  const dir = direction === 'random' ? (Math.random() > 0.5 ? 1 : -1) : direction === 'right' ? 1 : -1;
  const speed = room.gameType === 'pong' ? 5.5 : 4.5;
  const angle = (Math.random() - 0.5) * (Math.PI / 3);
  room.ball.vx = Math.cos(angle) * speed * dir;
  room.ball.vy = Math.sin(angle) * speed;
  room.ball.speed = speed;
}

function broadcastToRoom(room: Room, payload: unknown) {
  const json = JSON.stringify(payload);
  const targetIds = new Set([...Object.keys(room.players), ...room.spectators]);
  for (const [ws, info] of socketToRoom.entries()) {
    if (info.roomId === room.id && targetIds.has(info.playerId)) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(json);
      }
    }
  }
}

function broadcastRoomsList() {
  const summary = Array.from(rooms.values()).map(r => ({
    id: r.id,
    name: r.name,
    gameType: r.gameType,
    playerCount: Object.keys(r.players).length,
    status: r.status,
    score1: r.score1,
    score2: r.score2,
    player1: Object.values(r.players).find(p => p.role === 'player1')?.username || 'Empty',
    player2: Object.values(r.players).find(p => p.role === 'player2')?.username || 'Waiting...',
  }));

  const json = JSON.stringify({ type: 'rooms_list', rooms: summary });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
}

// Global Authoritative 60 FPS Physics Simulation Loop
setInterval(() => {
  const now = Date.now();

  for (const [roomId, room] of rooms.entries()) {
    // Auto cleanup stale rooms inactive for > 15 minutes
    if (now - room.lastActive > 15 * 60 * 1000) {
      rooms.delete(roomId);
      broadcastRoomsList();
      continue;
    }

    if (room.status === 'countdown') {
      room.countdown -= 1 / 60;
      if (room.countdown <= 0) {
        room.status = 'playing';
        resetPuck(room, 'random');
        broadcastToRoom(room, { type: 'game_started', room });
      } else {
        broadcastToRoom(room, {
          type: 'countdown_tick',
          countdown: Math.ceil(room.countdown),
        });
      }
      continue;
    }

    if (room.status !== 'playing') continue;

    const b = room.ball;
    const p1 = Object.values(room.players).find(p => p.role === 'player1');
    const p2 = Object.values(room.players).find(p => p.role === 'player2');

    if (!p1 || !p2) continue;

    // --- CYBER PONG SIMULATION ---
    if (room.gameType === 'pong') {
      b.x += b.vx;
      b.y += b.vy;

      // Bounce top & bottom
      if (b.y - b.radius <= 0) {
        b.y = b.radius;
        b.vy = Math.abs(b.vy);
      } else if (b.y + b.radius >= TABLE_HEIGHT) {
        b.y = TABLE_HEIGHT - b.radius;
        b.vy = -Math.abs(b.vy);
      }

      const paddleHeight = 90;
      const paddleWidth = 14;
      const p1X = 35;
      const p2X = TABLE_WIDTH - 35;

      // Check collision with Player 1 Paddle
      if (
        b.x - b.radius <= p1X + paddleWidth / 2 &&
        b.x + b.radius >= p1X - paddleWidth / 2 &&
        b.y >= p1.y - paddleHeight / 2 &&
        b.y <= p1.y + paddleHeight / 2 &&
        b.vx < 0
      ) {
        const offset = (b.y - p1.y) / (paddleHeight / 2); // -1 to 1
        const maxAngle = (Math.PI / 180) * 55;
        const angle = offset * maxAngle;
        b.speed = Math.min(13, b.speed + 0.35);
        b.vx = Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
        b.x = p1X + paddleWidth / 2 + b.radius;
        room.lastTouch = 'player1';
        broadcastToRoom(room, { type: 'paddle_hit', side: 'left', y: b.y });
      }

      // Check collision with Player 2 Paddle
      if (
        b.x + b.radius >= p2X - paddleWidth / 2 &&
        b.x - b.radius <= p2X + paddleWidth / 2 &&
        b.y >= p2.y - paddleHeight / 2 &&
        b.y <= p2.y + paddleHeight / 2 &&
        b.vx > 0
      ) {
        const offset = (b.y - p2.y) / (paddleHeight / 2);
        const maxAngle = (Math.PI / 180) * 55;
        const angle = offset * maxAngle;
        b.speed = Math.min(13, b.speed + 0.35);
        b.vx = -Math.cos(angle) * b.speed;
        b.vy = Math.sin(angle) * b.speed;
        b.x = p2X - paddleWidth / 2 - b.radius;
        room.lastTouch = 'player2';
        broadcastToRoom(room, { type: 'paddle_hit', side: 'right', y: b.y });
      }

      // Goal Left (P2 scores)
      if (b.x < 0) {
        room.score2 += 1;
        checkWinCondition(room, 'player2');
        if (room.status === 'playing') {
          resetPuck(room, 'left');
          broadcastToRoom(room, { type: 'goal_scored', scorer: 'player2', score1: room.score1, score2: room.score2 });
        }
      }
      // Goal Right (P1 scores)
      else if (b.x > TABLE_WIDTH) {
        room.score1 += 1;
        checkWinCondition(room, 'player1');
        if (room.status === 'playing') {
          resetPuck(room, 'right');
          broadcastToRoom(room, { type: 'goal_scored', scorer: 'player1', score1: room.score1, score2: room.score2 });
        }
      }
    }

    // --- NEON AIR HOCKEY SIMULATION ---
    else if (room.gameType === 'hockey') {
      b.x += b.vx;
      b.y += b.vy;

      // Friction damping
      b.vx *= 0.993;
      b.vy *= 0.993;

      // Top and bottom rail bounce
      if (b.y - b.radius <= 10) {
        b.y = 10 + b.radius;
        b.vy = Math.abs(b.vy) * 0.95;
      } else if (b.y + b.radius >= TABLE_HEIGHT - 10) {
        b.y = TABLE_HEIGHT - 10 - b.radius;
        b.vy = -Math.abs(b.vy) * 0.95;
      }

      // Left rail bounce (except inside goal slot)
      if (b.x - b.radius <= 10) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          // Goal for Player 2!
          if (b.x <= 0) {
            room.score2 += 1;
            checkWinCondition(room, 'player2');
            if (room.status === 'playing') {
              resetPuck(room, 'right');
              broadcastToRoom(room, { type: 'goal_scored', scorer: 'player2', score1: room.score1, score2: room.score2 });
            }
          }
        } else {
          b.x = 10 + b.radius;
          b.vx = Math.abs(b.vx) * 0.95;
        }
      }

      // Right rail bounce (except inside goal slot)
      if (b.x + b.radius >= TABLE_WIDTH - 10) {
        if (b.y >= GOAL_TOP && b.y <= GOAL_BOTTOM) {
          // Goal for Player 1!
          if (b.x >= TABLE_WIDTH) {
            room.score1 += 1;
            checkWinCondition(room, 'player1');
            if (room.status === 'playing') {
              resetPuck(room, 'left');
              broadcastToRoom(room, { type: 'goal_scored', scorer: 'player1', score1: room.score1, score2: room.score2 });
            }
          }
        } else {
          b.x = TABLE_WIDTH - 10 - b.radius;
          b.vx = -Math.abs(b.vx) * 0.95;
        }
      }

      // Mallet 1 Collision (Player 1 - Left)
      handleMalletCollision(b, p1, 'player1', room);

      // Mallet 2 Collision (Player 2 - Right)
      handleMalletCollision(b, p2, 'player2', room);
    }

    // Broadcast authoritative position tick
    broadcastToRoom(room, {
      type: 'game_tick',
      ball: room.ball,
      score1: room.score1,
      score2: room.score2,
      p1: { x: p1.x, y: p1.y },
      p2: { x: p2.x, y: p2.y },
    });
  }
}, 1000 / 60);

function handleMalletCollision(
  ball: Room['ball'],
  player: RoomPlayer,
  role: 'player1' | 'player2',
  room: Room
) {
  const malletRadius = 26;
  const dx = ball.x - player.x;
  const dy = ball.y - player.y;
  const dist = Math.hypot(dx, dy);

  if (dist < ball.radius + malletRadius) {
    const angle = Math.atan2(dy, dx);
    const overlap = ball.radius + malletRadius - dist;

    // Push puck outside overlap
    ball.x += Math.cos(angle) * overlap;
    ball.y += Math.sin(angle) * overlap;

    // Elastic collision + player mallet impulse
    const baseImpact = 6.5;
    const playerSpeed = Math.hypot(player.vx, player.vy);
    const speed = Math.min(18, baseImpact + playerSpeed * 0.6);

    ball.vx = Math.cos(angle) * speed + player.vx * 0.4;
    ball.vy = Math.sin(angle) * speed + player.vy * 0.4;

    room.lastTouch = role;
    broadcastToRoom(room, {
      type: 'mallet_hit',
      side: role === 'player1' ? 'left' : 'right',
      x: ball.x,
      y: ball.y,
    });
  }
}

function checkWinCondition(room: Room, potentialWinnerRole: 'player1' | 'player2') {
  const target = room.maxScore;
  const score = potentialWinnerRole === 'player1' ? room.score1 : room.score2;

  if (score >= target) {
    room.status = 'gameover';
    room.winner = potentialWinnerRole;
    const winnerPlayer = Object.values(room.players).find(p => p.role === potentialWinnerRole);
    room.winnerName = winnerPlayer?.username || (potentialWinnerRole === 'player1' ? 'Player 1' : 'Player 2');

    broadcastToRoom(room, {
      type: 'game_over',
      winner: potentialWinnerRole,
      winnerName: room.winnerName,
      score1: room.score1,
      score2: room.score2,
    });
    broadcastRoomsList();
  }
}

// WebSocket Connection Handlers
wss.on('connection', (ws: WebSocket) => {
  const playerId = Math.random().toString(36).substring(2, 9);

  ws.on('message', (data: string) => {
    try {
      const msg = JSON.parse(data.toString());

      if (msg.type === 'list_rooms') {
        broadcastRoomsList();
      }

      // CREATE ROOM
      else if (msg.type === 'create_room') {
        const roomId = (msg.gameType === 'pong' ? 'PONG-' : 'AIR-') + Math.floor(100 + Math.random() * 900);
        const newRoom: Room = {
          id: roomId,
          gameType: msg.gameType === 'pong' ? 'pong' : 'hockey',
          name: msg.name || `Arena ${roomId}`,
          hostId: playerId,
          maxScore: Number(msg.maxScore) || 5,
          players: {
            [playerId]: {
              id: playerId,
              username: msg.username || 'Host Pilot',
              avatar: msg.avatar || '🤖',
              role: 'player1',
              ready: true,
              x: msg.gameType === 'pong' ? 35 : 120,
              y: TABLE_HEIGHT / 2,
              prevX: 120,
              prevY: TABLE_HEIGHT / 2,
              vx: 0,
              vy: 0,
            },
          },
          spectators: [],
          status: 'waiting',
          countdown: 3,
          score1: 0,
          score2: 0,
          ball: {
            x: TABLE_WIDTH / 2,
            y: TABLE_HEIGHT / 2,
            vx: 0,
            vy: 0,
            speed: 5,
            radius: msg.gameType === 'pong' ? 9 : 14,
          },
          lastActive: Date.now(),
        };

        rooms.set(roomId, newRoom);
        socketToRoom.set(ws, { roomId, playerId });

        ws.send(JSON.stringify({
          type: 'room_joined',
          room: newRoom,
          role: 'player1',
          myId: playerId,
        }));

        broadcastRoomsList();
      }

      // JOIN ROOM
      else if (msg.type === 'join_room') {
        const room = rooms.get(msg.roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: 'Salon introuvable.' }));
          return;
        }

        const existingPlayers = Object.values(room.players);
        let assignedRole: 'player1' | 'player2' | 'spectator' = 'spectator';

        if (existingPlayers.length < 2) {
          assignedRole = 'player2';
          room.players[playerId] = {
            id: playerId,
            username: msg.username || 'Challenger',
            avatar: msg.avatar || '⚡',
            role: 'player2',
            ready: true,
            x: room.gameType === 'pong' ? TABLE_WIDTH - 35 : TABLE_WIDTH - 120,
            y: TABLE_HEIGHT / 2,
            prevX: TABLE_WIDTH - 120,
            prevY: TABLE_HEIGHT / 2,
            vx: 0,
            vy: 0,
          };

          // If both players present and ready -> start countdown!
          if (Object.keys(room.players).length === 2) {
            room.status = 'countdown';
            room.countdown = 3;
          }
        } else {
          room.spectators.push(playerId);
        }

        room.lastActive = Date.now();
        socketToRoom.set(ws, { roomId: room.id, playerId });

        ws.send(JSON.stringify({
          type: 'room_joined',
          room,
          role: assignedRole,
          myId: playerId,
        }));

        broadcastToRoom(room, { type: 'room_update', room });
        broadcastRoomsList();
      }

      // PADDLE / MALLET MOVEMENT
      else if (msg.type === 'move_paddle') {
        const info = socketToRoom.get(ws);
        if (!info) return;
        const room = rooms.get(info.roomId);
        if (!room) return;
        const player = room.players[info.playerId];
        if (!player) return;

        room.lastActive = Date.now();

        // Calculate velocity for impulse collisions
        const currentX = typeof msg.x === 'number' ? msg.x : player.x;
        const currentY = typeof msg.y === 'number' ? msg.y : player.y;

        player.vx = (currentX - player.prevX) * 0.8;
        player.vy = (currentY - player.prevY) * 0.8;
        player.prevX = currentX;
        player.prevY = currentY;

        if (room.gameType === 'pong') {
          player.y = Math.max(50, Math.min(TABLE_HEIGHT - 50, currentY));
        } else {
          // Hockey constraints
          if (player.role === 'player1') {
            player.x = Math.max(40, Math.min(TABLE_WIDTH / 2 - 40, currentX));
          } else {
            player.x = Math.max(TABLE_WIDTH / 2 + 40, Math.min(TABLE_WIDTH - 40, currentX));
          }
          player.y = Math.max(40, Math.min(TABLE_HEIGHT - 40, currentY));
        }
      }

      // PLAY AGAIN / REPLAY
      else if (msg.type === 'play_again') {
        const info = socketToRoom.get(ws);
        if (!info) return;
        const room = rooms.get(info.roomId);
        if (!room) return;

        room.score1 = 0;
        room.score2 = 0;
        room.status = 'countdown';
        room.countdown = 3;
        room.winner = undefined;
        room.winnerName = undefined;
        resetPuck(room, 'random');

        broadcastToRoom(room, { type: 'room_update', room });
        broadcastRoomsList();
      }

      // CHAT / QUICK EMOJI
      else if (msg.type === 'send_emoji') {
        const info = socketToRoom.get(ws);
        if (!info) return;
        const room = rooms.get(info.roomId);
        if (!room) return;
        const player = room.players[info.playerId];

        broadcastToRoom(room, {
          type: 'emoji_broadcast',
          sender: player?.username || 'Pilot',
          emoji: msg.emoji,
          role: player?.role || 'spectator',
        });
      }

      // LEAVE ROOM
      else if (msg.type === 'leave_room') {
        handleDisconnect(ws);
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', () => {
    handleDisconnect(ws);
  });
});

function handleDisconnect(ws: WebSocket) {
  const info = socketToRoom.get(ws);
  if (!info) return;

  const room = rooms.get(info.roomId);
  socketToRoom.delete(ws);

  if (room) {
    delete room.players[info.playerId];
    room.spectators = room.spectators.filter(id => id !== info.playerId);

    if (Object.keys(room.players).length === 0) {
      rooms.delete(room.id);
    } else {
      room.status = 'waiting';
      broadcastToRoom(room, { type: 'player_left', room });
    }
    broadcastRoomsList();
  }
}

// -------------------------------------------------------------
// VITE DEV SERVER / PRODUCTION STATIC SERVING
// -------------------------------------------------------------
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`[AI Studio] Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
