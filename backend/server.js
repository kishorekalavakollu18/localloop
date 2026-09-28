const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config();

const connectDB = require('./src/config/db');

// Route imports
const authRoutes = require('./src/routes/authRoutes');
const providerRoutes = require('./src/routes/providerRoutes');
const bookingRoutes = require('./src/routes/bookingRoutes');
const reviewRoutes = require('./src/routes/reviewRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const messageRoutes = require('./src/routes/messageRoutes');

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

const jwt = require('jsonwebtoken');
const Booking = require('./src/models/Booking');
const { getDrivingRoute } = require('./src/utils/geocoder');

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

  // Swiggy-Style Live GPS Tracking Rooms & Real-Time Moving Marker
  socket.on('join_tracking_room', (bookingId) => {
    if (bookingId) {
      socket.join(`tracking_${bookingId}`);
    }
  });

  socket.on('leave_tracking_room', (bookingId) => {
    if (bookingId) {
      socket.leave(`tracking_${bookingId}`);
    }
  });

  // Real-time device GPS updates streamed from provider
  socket.on('provider_location_update', async (data) => {
    try {
      const { bookingId, coordinates, heading, speed, token } = data || {};
      if (!bookingId || !coordinates || !Array.isArray(coordinates) || coordinates.length !== 2) {
        return;
      }

      // Security: Validate JWT token and authorize assigned provider
      let userId = null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          userId = decoded.id;
        } catch (e) {
          socket.emit('tracking_error', { message: 'Unauthorized GPS streaming: Invalid token' });
          return;
        }
      }

      const booking = await Booking.findById(bookingId).populate('providerId');
      if (!booking) return;

      if (userId && booking.providerId?.userId?.toString() !== userId.toString()) {
        socket.emit('tracking_error', { message: 'Unauthorized: Only the assigned provider can stream GPS' });
        return;
      }

      const lng = parseFloat(coordinates[0]);
      const lat = parseFloat(coordinates[1]);
      const newCoords = [lng, lat];

      booking.liveTracking.isTrackingActive = true;
      booking.liveTracking.currentProviderLocation = {
        type: 'Point',
        coordinates: newCoords,
      };
      booking.liveTracking.heading = Number(heading) || 0;
      booking.liveTracking.speed = Number(speed) || 0;
      booking.liveTracking.lastUpdated = new Date();

      if (booking.customerLocation?.coordinates?.length === 2) {
        const routeInfo = await getDrivingRoute(newCoords, booking.customerLocation.coordinates);
        if (routeInfo) {
          booking.liveTracking.distanceRemainingKm = routeInfo.distanceKm;
          booking.liveTracking.etaMinutes = routeInfo.etaMinutes;
          booking.liveTracking.routePolyline = routeInfo.polyline;
        }
      }

      await booking.save();

      // Emit to all users watching this booking's tracking room
      io.to(`tracking_${bookingId}`).emit('provider_location_changed', {
        bookingId,
        coordinates: newCoords,
        heading: booking.liveTracking.heading,
        speed: booking.liveTracking.speed,
        distanceRemainingKm: booking.liveTracking.distanceRemainingKm,
        etaMinutes: booking.liveTracking.etaMinutes,
        routePolyline: booking.liveTracking.routePolyline,
        lastUpdated: booking.liveTracking.lastUpdated,
      });
    } catch (err) {
      console.error('Socket provider_location_update error:', err.message);
    }
  });

  socket.on('stop_tracking', async (data) => {
    try {
      const { bookingId } = data || {};
      if (!bookingId) return;
      io.to(`tracking_${bookingId}`).emit('tracking_stopped', {
        bookingId,
        message: 'Live tracking stopped.',
      });
    } catch (err) {}
  });

  socket.on('disconnect', () => {});
});

// Connect to MongoDB
connectDB();

// Security Headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
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
