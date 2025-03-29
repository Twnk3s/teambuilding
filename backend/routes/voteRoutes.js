const express = require('express');
const router = express.Router();

// --- Import controller functions ---
// Make sure ALL needed functions are imported
const {
    castVote,
    getVoteResults,
    getMyVote,
    getDetailedVoteResults // <-- *** IMPORT THIS FUNCTION ***
 } = require('../controllers/voteController'); // Ensure this path is correct

// --- Import middleware ---
// Make sure BOTH protect and isAdmin are imported
const { protect, isAdmin } = require('../middleware/authMiddleware'); // <-- *** IMPORT isAdmin ***

// --- Define routes ---

// GET /api/votes/results - Get aggregated vote results (Public)
router.get('/results', getVoteResults);

// --- Add the missing route for detailed results ---
// GET /api/votes/detailed-results - Get detailed list for Admin
router.get(
    '/detailed-results', // <-- *** THE PATH ***
    protect,             // <-- Requires login
    isAdmin,             // <-- Requires Admin role
    getDetailedVoteResults // <-- The controller function to handle it
);
// --- End added route ---

// POST /api/votes - Cast a vote for a destination (Protected)
router.post('/', protect, castVote);

// GET /api/votes/my-vote - Check if the current user has voted (Protected)
router.get('/my-vote', protect, getMyVote);


module.exports = router;