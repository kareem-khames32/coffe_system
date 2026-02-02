const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Get user from database
        const [users] = await db.query(
            'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user not found'
            });
        }

        req.user = users[0];
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin only.'
        });
    }
    next();
};

// Check specific permission
exports.checkPermission = (permission) => {
    return (req, res, next) => {
        // Admin has all permissions
        if (req.user.role === 'admin') {
            return next();
        }

        // Check if cashier has the specific permission
        if (!req.user[permission]) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Permission '${permission}' required.`
            });
        }
        next();
    };
};
