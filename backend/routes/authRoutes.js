const express = require('express');
const router = express.Router();

// Import controller functions
const {
    register,
    login,
    getMe
} = require('../controllers/authController'); // We'll create this next

// Import authentication middleware
const { protect } = require('../middleware/authMiddleware');

// Define routes
router.post('/register', register); // Route for user registration
router.post('/login', login);       // Route for user login
router.get('/me', protect, getMe);  // Route to get current user info (protected)

module.exports = router;