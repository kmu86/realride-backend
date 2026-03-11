const { paymentQueue, notificationQueue, rideTimeoutQueue } = require('../utils/queue');
const logger = require('../utils/logger');
const Ride = require('../models/Ride');

exports.initWorkers = () => {
    // Payment Worker
    paymentQueue.process(async (job) => {
        const { rideId, amount, userId, idempotencyKey } = job.data;
        logger.info(`Processing payment for ride ${rideId}, User ${userId}, Key ${idempotencyKey}`);

        // Mock gateway call
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update database status
        await Ride.findByIdAndUpdate(rideId, { status: 'completed' });
        logger.info(`Payment successful for ride ${rideId}`);
        return { success: true };
    });

    // Notification Worker
    notificationQueue.process(async (job) => {
        const { userId, message, type } = job.data;
        logger.info(`Sending ${type} notification to user ${userId}: ${message}`);
        // Integration with FCM/Push Service would go here
        return { success: true };
    });

    // Ride Timeout Worker
    rideTimeoutQueue.process(async (job) => {
        const { rideId } = job.data;
        const ride = await Ride.findById(rideId);
        if (ride && ride.status === 'searching') {
            ride.status = 'cancelled';
            await ride.save();
            logger.info(`Ride ${rideId} timed out and cancelled`);
            // Notify rider
        }
    });

    logger.info('Background workers initialized');
};
