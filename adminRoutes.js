const express = require('express');
const router = express.Router();
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Endpoint to update driver pricing (base fare and price per km).
 */
router.post('/driver/pricing', async (req, res) => {
    try {
        const { driverId, pricePerKm, baseFare } = req.body;

        if (!driverId) return res.status(400).json({ message: 'driverId is required' });

        await User.findByIdAndUpdate(driverId, {
            pricePerKm,
            baseFare
        });

        logger.info(`Admin updated pricing for driver ${driverId}`);
        res.json({ success: true, message: 'Pricing updated successfully' });
    } catch (err) {
        logger.error(`Admin pricing update error: ${err.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
