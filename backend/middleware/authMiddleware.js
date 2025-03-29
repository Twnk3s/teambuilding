const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Need User model to find user from token
const Role = require('../models/Role'); // Need Role model to populate user's role name

// Middleware to protect routes that require authentication
exports.protect = async (req, res, next) => {
    let token;

    // Check if the token is sent in the Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        // Extract token from header (format: "Bearer <token>")
        token = req.headers.authorization.split(' ')[1];
    }
    // Optional: Check for token in cookies as well (more complex setup)
    // else if (req.cookies.token) {
    //     token = req.cookies.token;
    // }

    // Make sure token exists
    if (!token) {
        // Using return next(...) passes the error to the central error handler
        return next(new Error('Not authorized to access this route (No token)'));
        // Or send direct response:
        // return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }

    try {
        // Verify the token using the JWT_SECRET from environment variables
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user associated with the token's ID
        // Select '-password' to ensure password hash is NOT fetched here
        // Populate 'role' to get the role document (specifically the name) associated with the user
        req.user = await User.findById(decoded.id).select('-password').populate('role');

        if (!req.user) {
            // User belonging to this token no longer exists
             return next(new Error('User not found for this token'));
            // Or send direct response:
            // return res.status(401).json({ success: false, message: 'User not found' });
        }

        // User is valid, proceed to the next middleware or route handler
        next();
    } catch (err) {
        console.error('JWT Verification/User Fetch Error:', err); // Log the specific JWT error
         // Pass error to central error handler (will catch JsonWebTokenError, TokenExpiredError etc.)
         return next(new Error('Not authorized to access this route (Token failed)'));
        // Or send direct response:
        // return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
    }
};

// Middleware to grant access based on user roles
// Accepts one or more role names as arguments (e.g., authorize('Admin'), authorize('Admin', 'Manager'))
exports.authorize = (...roles) => {
    return (req, res, next) => {
        // This middleware assumes 'protect' middleware has already run and attached req.user
        if (!req.user || !req.user.role) {
             // Should not happen if 'protect' ran correctly, but good safety check
             return next(new Error('Authorization check failed: User or role not found on request'));
        }

        if (!roles.includes(req.user.role.name)) {
            // User's role is not in the list of allowed roles
             return next(new Error(`User role '${req.user.role.name}' is not authorized to access this route`));
            // Or send direct response:
            // return res.status(403).json({ // 403 Forbidden
            //     success: false,
            //     message: `User role '${req.user.role.name}' is not authorized to access this route`
            // });
        }
        // User has the required role, proceed
        next();
    };
};

// Convenience middleware for checking if the user is specifically an Admin
exports.isAdmin = exports.authorize('Admin');