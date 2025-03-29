const Vote = require('../models/Vote');
const Destination = require('../models/Destination'); // To check if destination exists and get deadline
const User = require('../models/User'); // Needed for population in detailed results
const mongoose = require('mongoose'); // Needed for ObjectId validation and aggregation
const jwt = require('jsonwebtoken'); // Needed to decode token for userVote in results

// --- Helper Function ---
// Checks if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

// --- Controller Functions ---

/**
 * @desc    Cast a vote for a destination, checking deadline
 * @route   POST /api/votes
 * @access  Private (Employee or Admin - requires 'protect' middleware)
 */
exports.castVote = async (req, res, next) => {
    // Ensure req.user exists (guaranteed by 'protect' middleware if setup correctly)
    if (!req.user || !req.user.id) {
        console.error('[castVote] FATAL: req.user not found after protect middleware.');
        return next({ statusCode: 500, message: 'Authentication context error.' });
    }
    const userId = req.user.id;
    const { destinationId } = req.body;

    console.log(`[castVote] User ${userId} attempting vote for Destination ${destinationId}`);

    try {
        // 1. Validate destinationId format
        if (!isValidObjectId(destinationId)) {
            console.warn(`[castVote] Invalid Destination ID format provided: ${destinationId}`);
            return next({ statusCode: 400, message: 'Invalid Destination ID format.' });
        }

        // 2. Check if destination exists AND get its deadline
        console.log(`[castVote] Verifying existence and deadline for destination ${destinationId}...`);
        // Fetch the destination document, including the votingDeadline field
        const destination = await Destination.findById(destinationId).select('votingDeadline name'); // Select only needed fields
        if (!destination) {
            console.warn(`[castVote] Attempt to vote for non-existent Destination ID: ${destinationId}`);
            return next({ statusCode: 404, message: 'Destination not found.' });
        }
        console.log(`[castVote] Destination '${destination.name}' found. Deadline: ${destination.votingDeadline || 'None'}`);

        // --- 3. CHECK VOTING DEADLINE ---
        if (destination.votingDeadline) {
            const now = new Date();
            // Compare current time with the deadline
            if (now > destination.votingDeadline) {
                console.warn(`[castVote] Vote attempt failed: Voting deadline (${destination.votingDeadline.toISOString()}) has passed for Destination ${destinationId}.`);
                // Return 400 Bad Request as the action is no longer allowed
                return next({ statusCode: 400, message: 'The voting deadline for this destination has passed.' });
            }
             console.log(`[castVote] Voting deadline check passed (Now: ${now.toISOString()}).`);
        } else {
             console.log(`[castVote] No voting deadline set for this destination.`);
        }
        // --- END DEADLINE CHECK ---

        // 4. Attempt to create the vote document.
        // The unique index on Vote model (user: 1) prevents duplicates.
        console.log(`[castVote] Creating vote document for User ${userId} -> Destination ${destinationId}...`);
        const vote = await Vote.create({
            user: userId,
            destination: destinationId, // Use destination._id for clarity
        });

        console.log(`[castVote] Vote created successfully: ${vote._id}`);
        // Return the newly created vote document
        res.status(201).json({ // Use 201 Created status
            success: true,
            data: vote
        });

    } catch (err) {
        // Handle specific duplicate key error (user already voted)
        if (err.code === 11000 && err.keyPattern?.user) { // Safer check for keyPattern
            console.log(`[castVote] User ${userId} has already voted (Duplicate key error 11000).`);
            // Return 400 Bad Request as user tried an invalid action
            return next({ statusCode: 400, message: 'You have already cast your vote.' });
        }
        // Handle other potential errors (DB connection, validation, etc.)
        console.error('[castVote] Unexpected error during vote creation:', err);
        next(err); // Pass to the central error handler
    }
};


/**
 * @desc    Get aggregated vote results (counts per destination) and user's vote status
 * @route   GET /api/votes/results
 * @access  Public
 */
exports.getVoteResults = async (req, res, next) => {
    console.log('[getVoteResults] Request received for aggregated vote results.');
    try {
        // --- Aggregation Pipeline ---
        console.log('[getVoteResults] Starting aggregation pipeline...');
        const resultsPromise = Vote.aggregate([
            { $group: { _id: '$destination', count: { $sum: 1 } } },
            { $lookup: { from: 'destinations', localField: '_id', foreignField: '_id', as: 'destinationDoc' } },
            { $match: { destinationDoc: { $ne: [] } } }, // Exclude votes for deleted destinations
            { $unwind: '$destinationDoc' },
            {
                $project: { // Reshape output
                    _id: 0,
                    destinationId: '$_id',
                    name: '$destinationDoc.name',
                    location: '$destinationDoc.location',
                    imageUrl: '$destinationDoc.imageUrl',
                    cost: '$destinationDoc.cost',
                    description: '$destinationDoc.description',
                    votingDeadline: '$destinationDoc.votingDeadline', // <-- Include deadline
                    voteCount: '$count'
                }
            },
            { $sort: { voteCount: -1, name: 1 } } // Sort by votes (desc), then name (asc)
        ]);

        // --- User Vote Check (Concurrent) ---
        let userVoteQuery = null;
        let userIdIfValid = null;
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            console.log('[getVoteResults] Auth token found. Verifying...');
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                userIdIfValid = decoded.id;
                console.log(`[getVoteResults] Token valid for user ${userIdIfValid}. Querying user vote...`);
                userVoteQuery = Vote.findOne({ user: userIdIfValid }).select('destination').lean();
            } catch (jwtError) {
                console.log("[getVoteResults] Token verification failed (Non-critical):", jwtError.message);
            }
        } else {
            console.log('[getVoteResults] No auth token found.');
        }

        // --- Await Concurrent Operations ---
        const [results, userVoteDoc] = await Promise.all([resultsPromise, userVoteQuery]);
        console.log(`[getVoteResults] Aggregation completed (${results.length} results). User vote query completed.`);

        const userVotedForDestinationId = userVoteDoc ? userVoteDoc.destination.toString() : null;
        if (userIdIfValid && userVotedForDestinationId) { /* Log vote found */ }
        else if (userIdIfValid) { /* Log no vote found */ }

        // --- Send Response ---
        console.log('[getVoteResults] Sending final aggregated results response.');
        res.status(200).json({
             success: true,
             results, // Includes deadline field now
             userVote: userVotedForDestinationId
        });

    } catch (err) {
        console.error('[getVoteResults] Unexpected error during processing:', err);
        next(err);
    }
};


/**
 * @desc    Get the current logged-in user's specific vote details
 * @route   GET /api/votes/my-vote
 * @access  Private (Requires 'protect' middleware)
 */
exports.getMyVote = async (req, res, next) => {
    // --- (Code remains the same as previous correct version) ---
    if (!req.user || !req.user.id) { /* ... error handling ... */ }
    const userId = req.user.id;
    console.log(`[getMyVote] Request received for user ${userId}`);
    try {
        console.log(`[getMyVote] Querying vote for user ${userId} with destination details...`);
        const vote = await Vote.findOne({ user: userId })
                              .populate('destination', 'name location imageUrl cost votingDeadline') // Include deadline
                              .lean();
        if (!vote) { /* ... return null data ... */ }
        console.log(`[getMyVote] Vote found for user ${userId}.`);
        res.status(200).json({ success: true, data: vote });
    } catch (err) { /* ... error handling ... */ }
};


/**
 * @desc    Get detailed vote list with user name and destination info
 * @route   GET /api/votes/detailed-results
 * @access  Private/Admin (Requires 'protect' and 'isAdmin' middleware)
 */
exports.getDetailedVoteResults = async (req, res, next) => {
    // --- (Code remains the same as previous correct version, already populates user name) ---
    console.log('[getDetailedVoteResults] Request received (Admin).');
    try {
        console.log('[getDetailedVoteResults] Querying all votes, populating user name and destination details...');
        const votes = await Vote.find()
            .populate({ path: 'user', select: 'name' }) // Populate user name
            .populate({ path: 'destination', select: 'name location' }) // Populate dest name/location
            .sort({ createdAt: -1 })
            .lean();
        console.log(`[getDetailedVoteResults] Found ${votes.length} votes.`);
        if (votes.length > 0 && votes.some(v => !v.user || !v.destination)) { /* ... warning ... */ }
        console.log('[getDetailedVoteResults] Sending detailed results response.');
        res.status(200).json({ success: true, count: votes.length, data: votes });
    } catch (err) { /* ... error handling ... */ }
};