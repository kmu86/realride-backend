const mongoose = require('mongoose');

const RideSchema = new mongoose.Schema({
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    pickup: { lat: Number, lng: Number },
    destination: { lat: Number, lng: Number },
    status: {
        type: String,
        enum: ['searching', 'accepted', 'arrived', 'started', 'completed', 'cancelled'],
        default: 'searching',
        index: true
    },
    fare: Number,
    createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Ride', RideSchema);
