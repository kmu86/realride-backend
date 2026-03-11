const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, index: true },
    phone: { type: String, unique: true, sparse: true, index: true },
    password: { type: String, required: true },
    name: String,
    role: { type: String, enum: ['rider', 'driver', 'admin'], default: 'rider', index: true },
    walletBalance: { type: Number, default: 0 },
    isOnline: { type: Boolean, default: false },
    lastLocation: {
        lat: Number,
        lng: Number,
        timestamp: Date
    },
    refreshToken: { type: String },
    // --- Driver Pricing ---
    pricePerKm: { type: Number, default: 12 },   // ₹ per km
    baseFare: { type: Number, default: 40 },
    bonusBalance: { type: Number, default: 0 },
    todayTrips: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', UserSchema);
