require('dotenv').config();
const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/room');
const fileRoutes = require('./routes/file');
const { socketAuthMiddleware } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = rawClientUrl.includes(',')
  ? rawClientUrl.split(',').map((u) => u.trim())
  : rawClientUrl;

// Express Middleware
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false
  })
);
app.use(
  cors({
    origin: allowedOrigins,
    credentials: true
  })
);
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/files', fileRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Production static file serving (if frontend is built in client/dist)
if (process.env.NODE_ENV === 'production') {
  const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    });
  }
}

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Socket Auth Middleware
io.use(socketAuthMiddleware);

// In-memory state for active participants and whiteboard strokes per room
const roomParticipants = new Map(); // roomId -> Map(socketId -> { socketId, user })
const roomWhiteboardStrokes = new Map(); // roomId -> Array(stroke)

io.on('connection', (socket) => {
  let currentRoomId = null;

  socket.on('join-room', ({ roomId }) => {
    if (!roomId) return;
    currentRoomId = roomId;
    socket.join(roomId);

    if (!roomParticipants.has(roomId)) {
      roomParticipants.set(roomId, new Map());
    }
    if (!roomWhiteboardStrokes.has(roomId)) {
      roomWhiteboardStrokes.set(roomId, []);
    }

    const participantsMap = roomParticipants.get(roomId);
    
    // Existing users currently in the room
    const existingUsers = Array.from(participantsMap.values());

    // Add new participant
    participantsMap.set(socket.id, {
      socketId: socket.id,
      user: socket.user
    });

    // Send existing users list to the joining socket
    socket.emit('room-users', { users: existingUsers });

    // Send current whiteboard strokes to the joining socket
    const strokes = roomWhiteboardStrokes.get(roomId) || [];
    socket.emit('whiteboard-state', strokes);

    // Notify other peers in the room
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      user: socket.user
    });
  });

  // WebRTC Signaling relays
  socket.on('offer', ({ target, offer }) => {
    io.to(target).emit('offer', {
      caller: socket.id,
      offer,
      user: socket.user
    });
  });

  socket.on('answer', ({ target, answer }) => {
    io.to(target).emit('answer', {
      caller: socket.id,
      answer
    });
  });

  socket.on('ice-candidate', ({ target, candidate }) => {
    io.to(target).emit('ice-candidate', {
      caller: socket.id,
      candidate
    });
  });

  // Real-time Chat
  socket.on('chat-message', ({ roomId, text }) => {
    if (!roomId || !text || !text.trim()) return;
    const message = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sender: socket.user.name,
      senderId: socket.user._id,
      text: text.trim(),
      timestamp: new Date().toISOString()
    };
    io.to(roomId).emit('chat-message', message);
  });

  // Real-time File Notification
  socket.on('file-shared', ({ roomId, file }) => {
    if (!roomId || !file) return;
    socket.to(roomId).emit('file-shared', file);
  });

  // Real-time Whiteboard
  socket.on('whiteboard-draw', ({ roomId, stroke }) => {
    if (!roomId || !stroke) return;
    const strokes = roomWhiteboardStrokes.get(roomId);
    if (strokes) {
      strokes.push(stroke);
      // Keep stroke history bounded to last 2000 strokes to prevent unbounded memory growth
      if (strokes.length > 2000) strokes.shift();
    }
    socket.to(roomId).emit('whiteboard-draw', stroke);
  });

  socket.on('whiteboard-clear', ({ roomId }) => {
    if (!roomId) return;
    roomWhiteboardStrokes.set(roomId, []);
    io.to(roomId).emit('whiteboard-clear');
  });

  const handleLeave = () => {
    if (currentRoomId && roomParticipants.has(currentRoomId)) {
      const participantsMap = roomParticipants.get(currentRoomId);
      participantsMap.delete(socket.id);
      if (participantsMap.size === 0) {
        roomParticipants.delete(currentRoomId);
        roomWhiteboardStrokes.delete(currentRoomId);
      }
      socket.to(currentRoomId).emit('user-left', { socketId: socket.id });
      socket.leave(currentRoomId);
      currentRoomId = null;
    }
  };

  socket.on('leave-room', handleLeave);
  socket.on('disconnect', handleLeave);
});

// Database connection & Server start
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB at', MONGO_URI);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    console.warn('Ensure MongoDB is running or configure MONGO_URI in .env');
  }

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();

