const User = require('../models/User');

/**
 * Calculates the fare for a ride based on distance and driver rates.
 * @param {string} driverId - The ID of the driver.
 * @param {number} distanceKm - The distance of the ride in kilometers.
 * @returns {Promise<number>} - The calculated fare rounded to the nearest integer.
 */
async function calculateFare(driverId, distanceKm) {
    const driver = await User.findById(driverId);
    if (!driver) throw new Error('Driver not found');

    const baseFare = driver.baseFare || 40;
    const perKm = driver.pricePerKm || 12;

    const fare = baseFare + (distanceKm * perKm);

    return Math.round(fare);
}

module.exports = {
    calculateFare
};
