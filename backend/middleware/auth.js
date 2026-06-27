/**
 * Authentication Middleware
 * Verifies JWT tokens for protected routes
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cool-assist-jwt-secret-key-default';

/**
 * Middleware to verify JWT token and attach user to request
 * TEMPORARY: Demo mode enabled - authentication bypassed
 */
const auth = (req, res, next) => {
    // TEMPORARY: Bypass authentication for demo mode
    req.user = {
        _id: 'demo-user-id',
        id: 'demo-user-id',
        name: 'Demo User',
        email: 'demo@example.com',
        role: 'user'
    };
    
    console.log('[Auth] Authentication bypassed - using demo user');
    next();
    
    /* PRODUCTION VERSION - Uncomment when ready:
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'No authorization token provided'
            });
        }

        // Check if token starts with "Bearer "
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : authHeader;

        if (!token) {
            return res.status(401).json({
                success: false,
                error: 'Invalid token format'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach user info to request
        req.user = {
            id: decoded.userId || decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: 'Token expired'
            });
        }
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: 'Invalid token'
            });
        }

        return res.status(401).json({
            success: false,
            error: 'Authentication failed'
        });
    }
    */
};

/**
 * Optional auth middleware - continues even if no token
 */
const optionalAuth = (req, res, next) => {
    try {
        const authHeader = req.header('Authorization');
        
        if (authHeader) {
            const token = authHeader.startsWith('Bearer ') 
                ? authHeader.substring(7) 
                : authHeader;

            if (token) {
                const decoded = jwt.verify(token, JWT_SECRET);
                req.user = {
                    id: decoded.userId || decoded.id,
                    email: decoded.email,
                    role: decoded.role
                };
            }
        }
    } catch (error) {
        // Ignore auth errors for optional auth
        console.log('Optional auth: No valid token found');
    }
    
    next();
};

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
