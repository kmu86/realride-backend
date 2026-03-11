const Ride = require('../models/Ride');
const logger = require('../utils/logger');
const dispatchService = require('../services/dispatchService');

exports.requestRide = async (req, res) => {
    try {
        const { lat, lng, fare } = req.body;
        const ride = new Ride({
            riderId: req.userId,
            pickup: { lat, lng },
            fare
        });
        await ride.save();

        logger.info(`Ride requested by ${req.userId}: ${ride._id}. Searching nearby drivers...`);

        // Use Redis GEO matching for dispatch
        const nearbyDrivers = await dispatchService.dispatchRide(ride._id, lat, lng);

        if (req.io && nearbyDrivers.length > 0) {
            // Notify only matched drivers
            nearbyDrivers.forEach(driverId => {
                req.io.to(`driver_${driverId}`).emit('ride_request', {
                    rideId: ride._id,
                    pickup: { lat, lng },
                    fare
                });
            });
        }

        res.json({
            rideId: ride._id,
            message: nearbyDrivers.length > 0 ? 'Searching for drivers...' : 'No drivers found nearby. Broadening search...',
            driversCount: nearbyDrivers.length
        });
    } catch (e) {
        logger.error(`Ride request error: ${e.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getSurge = (req, res) => {
    const hour = new Date().getHours();
    const multiplier = (hour > 17 && hour < 20) ? 1.5 : 1.0;
    res.json({ surge_multiplier: multiplier });
};
