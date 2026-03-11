const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const path = require('path');

const logger = require('./utils/logger');
const apiLimiter = require('./middleware/rateLimiter');
const authRoutes = require('./routes/authRoutes');
const rideRoutes = require('./routes/rideRoutes');
const adminRoutes = require('./routes/adminRoutes');
const User = require('./models/User');
const Ride = require('./models/Ride');
const dispatchService = require('./services/dispatchService');
const workerService = require('./services/workerService');
const fraudMiddleware = require('./middleware/fraudMiddleware');
const fareService = require('./services/fareService');
const bonusService = require('./services/bonusService');

dotenv.config();

// Initialize Workers
workerService.initWorkers();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: '*' },
    pingTimeout: 60000,
});

// --- Security & Global Middleware ---
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(fraudMiddleware); // Global fraud check
app.use('/api/', apiLimiter);

app.use((req, res, next) => {
    req.io = io;
    next();
});

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/rides', rideRoutes);
app.use('/api/admin', adminRoutes);

// Serve Admin Panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/health', (req, res) => res.status(200).send('OK'));

// --- Socket.IO Event Design ---
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Driver Events
    socket.on('driver_online', async (userId) => {
        await User.findByIdAndUpdate(userId, { isOnline: true });
        socket.join('drivers_room');
        socket.join(`driver_${userId}`); // For targeted dispatch
        logger.info(`Driver online: ${userId}`);
    });

    socket.on('driver_offline', async (userId) => {
        await User.findByIdAndUpdate(userId, { isOnline: false });
        socket.leave('drivers_room');
        socket.leave(`driver_${userId}`);
        logger.info(`Driver offline: ${userId}`);
    });

    socket.on('driver_location_update', async (data) => {
        const { userId, lat, lng } = data;

        // UPDATE REDIS GEO (Real-time)
        await dispatchService.updateDriverLocation(userId, lat, lng);

        // Broadcast to riders in the area (via room or global)
        io.emit('driver_moved', { userId, lat, lng });
    });

    socket.on('ride_accepted', async (data) => {
        const { rideId, driverId } = data;
        const ride = await Ride.findByIdAndUpdate(rideId, {
            driverId, status: 'accepted'
        }, { new: true });

        io.emit(`ride_status_${rideId}`, { status: 'accepted', driverId });
        io.to(`rider_${ride.riderId}`).emit('ride_update', { status: 'accepted', driverId });
        logger.info(`Ride ${rideId} accepted by driver ${driverId}`);
    });

    // Rider Events
    socket.on('join_rider_room', (userId) => {
        socket.join(`rider_${userId}`);
    });

    socket.on('ride_completed', async (data) => {
        const { rideId, driverId, distanceKm } = data;
        try {
            const fare = await fareService.calculateFare(driverId, distanceKm);

            await Ride.findByIdAndUpdate(rideId, {
                status: 'completed',
                fare: fare
            });

            await bonusService.updateDriverBonus(driverId);

            io.emit(`ride_status_${rideId}`, { status: 'completed', fare });
            logger.info(`Ride ${rideId} completed. Fare: ₹${fare}`);
        } catch (err) {
            logger.error(`Error completing ride ${rideId}: ${err.message}`);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

// --- Database & Server Start ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/superapp';

mongoose.connect(MONGO_URI)
    .then(() => logger.info('Connected to MongoDB'))
    .catch(err => logger.error('MongoDB connection error', err));

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

