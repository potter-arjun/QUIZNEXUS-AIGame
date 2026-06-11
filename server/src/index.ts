import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// Load Env
dotenv.config();

// Imports Routing & Sockets
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';
import dailyRoutes from './routes/dailyRoutes';
import { initializeSockets } from './services/socketService';

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins: (string | RegExp)[] = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/192\.168\.\d+\.\d+(:\d+)?$/,
  /\.vercel\.app$/,
];
if (process.env.CLIENT_URL) allowedOrigins.push(process.env.CLIENT_URL);

// Middleware Setup
app.use(cors({
  origin: (origin, cb) => {
    // allow non-browser requests (Postman, server-to-server) and matched origins
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      cb(null, true);
    } else {
      cb(new Error(`CORS blocked: ${origin}`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());

// Routes Setup
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/daily', dailyRoutes);

// Health Check Route
app.get('/health', (_req, res) => {
  res.status(200).json({ status: "ok", message: "Navodaya Quiz Battle server running smoothly" });
});

// Create Server
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize real-time handlers
initializeSockets(io);

// Listen
server.listen(PORT, () => {
  console.log(`=====================================================`);
  console.log(`🚀 Navodaya Quiz Battle Server running on port ${PORT}`);
  console.log(`📂 Health check endpoint: http://localhost:${PORT}/health`);
  console.log(`=====================================================`);
});

export { app, server };
