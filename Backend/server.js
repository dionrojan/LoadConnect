import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';

import { initDB } from './db/setup.js';
import { setupSocket } from './socket/chat.js';

import authRoutes from './routes/auth.js';
import tripRoutes from './routes/trips.js';
import bookingRoutes from './routes/bookings.js';
import messageRoutes from './routes/messages.js';
import reviewRoutes from './routes/reviews.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Initialize SQLite database
initDB();

// Middlewares
app.use(cors({
  origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [CORS_ORIGIN, 'http://localhost:3000', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
});

setupSocket(io);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'YOKI Backend API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/reviews', reviewRoutes);

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.path}` });
});

// Start HTTP + WebSocket Server
server.listen(PORT, () => {
  console.log(`🚀 YOKI API Server running at http://localhost:${PORT}`);
  console.log(`📡 Socket.IO listening for real-time chat`);
});
