const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Configure CORS for Socket.IO
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Store active rooms and their data
const rooms = new Map();

// Room data structure
class Room {
  constructor(id) {
    this.id = id;
    this.code = '// Welcome to the Realtime Collaborative Code Editor!\n// Start typing to see real-time collaboration in action.\n\nfunction hello() {\n    console.log("Hello, World!");\n}\n\nhello();';
    this.language = 'javascript';
    this.users = new Map();
    this.cursors = new Map();
    this.createdAt = new Date();
    this.lastActivity = new Date();
  }

  addUser(socketId, userData) {
    this.users.set(socketId, {
      id: socketId,
      name: userData.name || `User ${this.users.size + 1}`,
      color: userData.color || this.generateUserColor(),
      joinedAt: new Date()
    });
    this.lastActivity = new Date();
  }

  removeUser(socketId) {
    this.users.delete(socketId);
    this.cursors.delete(socketId);
    this.lastActivity = new Date();
  }

  updateCode(code) {
    this.code = code;
    this.lastActivity = new Date();
  }

  updateLanguage(language) {
    this.language = language;
    this.lastActivity = new Date();
  }

  updateCursor(socketId, cursor) {
    if (this.users.has(socketId)) {
      this.cursors.set(socketId, cursor);
    }
  }

  generateUserColor() {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
      '#BB8FCE', '#85C1E9', '#F8C471', '#82E0AA'
    ];
    return colors[this.users.size % colors.length];
  }

  getUsersArray() {
    return Array.from(this.users.values());
  }

  getCursorsArray() {
    return Array.from(this.cursors.entries()).map(([socketId, cursor]) => ({
      userId: socketId,
      user: this.users.get(socketId),
      ...cursor
    }));
  }
}

// API Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Realtime Collaborative Code Editor API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API information',
      'POST /room': 'Create a new room',
      'GET /room/:id': 'Get room information',
      'GET /health': 'Health check'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    activeRooms: rooms.size,
    totalConnections: io.engine.clientsCount
  });
});

app.post('/room', (req, res) => {
  const roomId = uuidv4();
  const room = new Room(roomId);
  rooms.set(roomId, room);
  
  res.json({
    roomId: roomId,
    message: 'Room created successfully'
  });
});

app.get('/room/:id', (req, res) => {
  const roomId = req.params.id;
  const room = rooms.get(roomId);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  res.json({
    roomId: room.id,
    language: room.language,
    userCount: room.users.size,
    createdAt: room.createdAt,
    lastActivity: room.lastActivity
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);
  
  // Join room
  socket.on('join-room', (data) => {
    const { roomId, user } = data;
    
    // Create room if it doesn't exist
    if (!rooms.has(roomId)) {
      rooms.set(roomId, new Room(roomId));
    }
    
    const room = rooms.get(roomId);
    
    // Leave previous rooms
    Array.from(socket.rooms).forEach(room => {
      if (room !== socket.id) {
        socket.leave(room);
      }
    });
    
    // Join new room
    socket.join(roomId);
    room.addUser(socket.id, user);
    
    // Send current room state to the new user
    socket.emit('room-state', {
      code: room.code,
      language: room.language,
      users: room.getUsersArray(),
      cursors: room.getCursorsArray()
    });
    
    // Notify other users about the new user
    socket.to(roomId).emit('user-joined', {
      user: room.users.get(socket.id),
      users: room.getUsersArray()
    });
    
    console.log(`User ${socket.id} joined room ${roomId}`);
  });
  
  // Handle code changes
  socket.on('code-change', (data) => {
    const { roomId, code, changes } = data;
    const room = rooms.get(roomId);
    
    if (room && room.users.has(socket.id)) {
      room.updateCode(code);
      
      // Broadcast changes to other users in the room
      socket.to(roomId).emit('code-change', {
        code,
        changes,
        userId: socket.id,
        user: room.users.get(socket.id)
      });
    }
  });
  
  // Handle language changes
  socket.on('language-change', (data) => {
    const { roomId, language } = data;
    const room = rooms.get(roomId);
    
    if (room && room.users.has(socket.id)) {
      room.updateLanguage(language);
      
      // Broadcast language change to other users
      socket.to(roomId).emit('language-change', {
        language,
        userId: socket.id,
        user: room.users.get(socket.id)
      });
    }
  });
  
  // Handle cursor position updates
  socket.on('cursor-change', (data) => {
    const { roomId, cursor } = data;
    const room = rooms.get(roomId);
    
    if (room && room.users.has(socket.id)) {
      room.updateCursor(socket.id, cursor);
      
      // Broadcast cursor position to other users
      socket.to(roomId).emit('cursor-change', {
        userId: socket.id,
        user: room.users.get(socket.id),
        cursor
      });
    }
  });
  
  // Handle chat messages (optional feature)
  socket.on('chat-message', (data) => {
    const { roomId, message } = data;
    const room = rooms.get(roomId);
    
    if (room && room.users.has(socket.id)) {
      const chatMessage = {
        id: uuidv4(),
        message,
        user: room.users.get(socket.id),
        timestamp: new Date()
      };
      
      // Broadcast message to all users in the room
      io.to(roomId).emit('chat-message', chatMessage);
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
    
    // Remove user from all rooms
    Array.from(socket.rooms).forEach(roomId => {
      if (roomId !== socket.id) {
        const room = rooms.get(roomId);
        if (room) {
          room.removeUser(socket.id);
          
          // Notify other users about the disconnection
          socket.to(roomId).emit('user-left', {
            userId: socket.id,
            users: room.getUsersArray()
          });
          
          // Clean up empty rooms after 5 minutes of inactivity
          if (room.users.size === 0) {
            setTimeout(() => {
              const currentRoom = rooms.get(roomId);
              if (currentRoom && currentRoom.users.size === 0) {
                rooms.delete(roomId);
                console.log(`Cleaned up empty room: ${roomId}`);
              }
            }, 5 * 60 * 1000); // 5 minutes
          }
        }
      }
    });
  });
  
  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for ${socket.id}:`, error);
  });
});

// Cleanup inactive rooms periodically
setInterval(() => {
  const now = new Date();
  const inactiveThreshold = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [roomId, room] of rooms.entries()) {
    if (room.users.size === 0 && (now - room.lastActivity) > inactiveThreshold) {
      rooms.delete(roomId);
      console.log(`Cleaned up inactive room: ${roomId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

