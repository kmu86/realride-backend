const redis = require('../utils/redis');
const logger = require('../utils/logger');

const DRIVER_LOCATIONS_KEY = 'driver_locations';

exports.updateDriverLocation = async (driverId, lat, lng) => {
    try {
        // lat, lng should be numbers
        await redis.geoAdd(DRIVER_LOCATIONS_KEY, {
            longitude: lng,
            latitude: lat,
            member: driverId.toString()
        });
        // Set expiry for real-time location to keep Redis clean (optional)
        // await redis.expire(DRIVER_LOCATIONS_KEY, 3600); 
    } catch (err) {
        logger.error(`Failed to update driver location in Redis: ${err.message}`);
    }
};

exports.findNearbyDrivers = async (lat, lng, radiusKm = 2) => {
    try {
        // GEORADIUS equivalent in modern redis client is geoSearch
        const nearbyDrivers = await redis.geoSearch(
            DRIVER_LOCATIONS_KEY,
            { longitude: lng, latitude: lat },
            { radius: radiusKm, unit: 'km' }
        );
        return nearbyDrivers;
    } catch (err) {
        logger.error(`Failed to find nearby drivers: ${err.message}`);
        return [];
    }
};

exports.dispatchRide = async (rideId, pickupLat, pickupLng) => {
    const radii = [2, 5, 10];
    let drivers = [];

    for (const radius of radii) {
        drivers = await this.findNearbyDrivers(pickupLat, pickupLng, radius);
        if (drivers.length > 0) {
            logger.info(`Found ${drivers.length} drivers within ${radius}km for ride ${rideId}`);
            break;
        }
    }

    return drivers;
};
