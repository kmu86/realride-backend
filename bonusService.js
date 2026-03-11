const User = require('../models/User');

/**
 * Updates the driver's trip count and applies bonuses if targets are met.
 * @param {string} driverId - The ID of the driver.
 */
async function updateDriverBonus(driverId) {
    const driver = await User.findById(driverId);
    if (!driver) return;

    driver.todayTrips += 1;

    // Fixed bonus rule: ₹200 for every 10 trips
    if (driver.todayTrips % 10 === 0) {
        driver.bonusBalance += 200;
    }

    await driver.save();
}

module.exports = {
    updateDriverBonus
};
