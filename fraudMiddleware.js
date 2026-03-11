const logger = require('../utils/logger');

const fraudCheck = (req, res, next) => {
    const deviceId = req.headers['x-device-id'];
    const ip = req.ip || req.connection.remoteAddress;

    // Simple Fraud Check: Log suspicious activity or block
    if (!deviceId) {
        logger.warn(`Potential fraud: Missing deviceId from IP ${ip}`);
        // In strictly hardened apps, you might block this:
        // return res.status(403).json({ message: 'Device identification required' });
    }

    // You could store and compare IP/DeviceId combinations in Redis to detect account sharing/gps spoofing

    req.fraudInfo = { deviceId, ip };
    next();
};

module.exports = fraudCheck;
