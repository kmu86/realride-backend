const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'refresh-secret-key';

exports.register = async (req, res) => {
    try {
        const { email, password, name, role, phone } = req.body;
        const hashedPassword = await bcrypt.hash(password, 12); // Salt rounds 12 as recommended
        const user = new User({ email, password: hashedPassword, name, role, phone });
        await user.save();
        logger.info(`User registered: ${email}`);
        res.status(201).json({ message: 'User created' });
    } catch (e) {
        logger.error(`Registration error: ${e.message}`);
        res.status(400).json({ message: e.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (user && await bcrypt.compare(password, user.password)) {
            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                JWT_SECRET,
                { expiresIn: '15m' } // Short expiry as recommended
            );
            const refreshToken = jwt.sign(
                { id: user._id },
                REFRESH_SECRET,
                { expiresIn: '7d' }
            );

            user.refreshToken = refreshToken;
            await user.save();

            logger.info(`User logged in: ${email}`);
            res.json({
                accessToken,
                refreshToken,
                user: { id: user._id, email: user.email, name: user.name, role: user.role }
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (e) {
        logger.error(`Login error: ${e.message}`);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.refreshToken = async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(401).json({ message: 'Refresh token required' });

    try {
        const user = await User.findOne({ refreshToken: token });
        if (!user) return res.status(403).json({ message: 'Invalid refresh token' });

        jwt.verify(token, REFRESH_SECRET, (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Invalid refresh token' });

            const accessToken = jwt.sign(
                { id: user._id, role: user.role },
                JWT_SECRET,
                { expiresIn: '15m' }
            );
            res.json({ accessToken });
        });
    } catch (e) {
        res.status(500).json({ message: 'Server error' });
    }
};
