const express = require('express');
const router = express.Router();
const rideController = require('../controllers/rideController');
const authenticate = require('../middleware/authMiddleware');

router.post('/request', authenticate, rideController.requestRide);
router.get('/surge', rideController.getSurge);

module.exports = router;
