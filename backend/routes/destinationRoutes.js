const express = require('express');
const router = express.Router();

// Import controller functions
const {
    getDestinations,
    getDestination,
    createDestination,
    updateDestination,
    deleteDestination
} = require('../controllers/destinationController'); // We'll create this next

// Import middleware for protection and authorization
const { protect, isAdmin } = require('../middleware/authMiddleware');

// Define routes

// Public routes (anyone can view destinations)
router.route('/')
    .get(getDestinations);

router.route('/:id')
    .get(getDestination);

// Protected Admin routes (only logged-in admins can add, update, delete)
router.route('/')
    .post(protect, isAdmin, createDestination); // Apply protect AND isAdmin middleware

router.route('/:id')
    .put(protect, isAdmin, updateDestination)    // Apply protect AND isAdmin middleware
    .delete(protect, isAdmin, deleteDestination); // Apply protect AND isAdmin middleware


module.exports = router;