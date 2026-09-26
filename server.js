const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const connectDB = require('./backend/src/config/db');

// Route imports
const authRoutes = require('./backend/src/routes/authRoutes');
const providerRoutes = require('./backend/src/routes/providerRoutes');
const bookingRoutes = require('./backend/src/routes/bookingRoutes');
const reviewRoutes = require('./backend/src/routes/reviewRoutes');
const adminRoutes = require('./backend/src/routes/adminRoutes');
const messageRoutes = require('./backend/src/routes/messageRoutes');

// Initialize app & server
const app = express();
app.set('trust proxy', 1);
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);

// Socket.io Real-Time Connection Listener
io.on('connection', (socket) => {
  socket.on('join_room', (roomId) => {
    if (roomId) socket.join(roomId.toString());
  });

  socket.on('send_message', (data) => {
    if (data && data.bookingId) {
      io.to(data.bookingId.toString()).emit('new_message', data);
    }
  });

  socket.on('disconnect', () => {});
});

// Connect to MongoDB
connectDB();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disable for Leaflet OpenStreetMap tiles & remote images
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate Limiting (Phase 2 & 4 Production Security)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // max requests per IP
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);

// CORS configuration for local and production deployment (Vercel + Render)
app.use(
  cors({
    origin: true, // Dynamically reflects origin (e.g. Vercel, localhost)
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'LocalLoop API & Socket.io engine running smoothly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/providers', providerRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 LocalLoop Backend & Socket.io running on http://localhost:${PORT}`);
});
