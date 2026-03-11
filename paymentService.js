const logger = require('../utils/logger');
const { paymentQueue } = require('../utils/queue');

exports.processPayment = async (rideId, userId, amount) => {
    try {
        const idempotencyKey = `PAY_${userId}_${Date.now()}`;

        // Add to queue for background processing
        await paymentQueue.add({
            rideId,
            userId,
            amount,
            idempotencyKey
        }, {
            attempts: 3,
            backoff: 5000 // 5 seconds
        });

        logger.info(`Payment job added to queue for ride ${rideId} with idempotency key ${idempotencyKey}`);
        return { success: true, idempotencyKey };
    } catch (err) {
        logger.error(`Failed to initiate payment for ride ${rideId}: ${err.message}`);
        return { success: false, error: err.message };
    }
};

exports.handleWalletUpdate = async (userId, amount) => {
    // Logic to update user wallet in MongoDB
    // This would typically be called by the payment worker after successful gateway response
    logger.info(`Wallet update requested for user ${userId}: ${amount}`);
};
