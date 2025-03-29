const Destination = require('../models/Destination');
const Vote = require('../models/Vote'); // Needed for cascade delete
const mongoose = require('mongoose'); // Needed for ObjectId validation

// Helper Function
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * @desc    Get all destinations
 * @route   GET /api/destinations
 * @access  Public
 */
exports.getDestinations = async (req, res, next) => {
    console.log('[getDestinations] Fetching all destinations...');
    try {
        // Fetch all, sort by newest first is common
        const destinations = await Destination.find().sort({ createdAt: -1 }).lean(); // Use lean() for read-only
        console.log(`[getDestinations] Found ${destinations.length} destinations.`);

        res.status(200).json({
            success: true,
            count: destinations.length,
            data: destinations
        });
    } catch (err) {
        console.error('[getDestinations] Error fetching destinations:', err);
        next(err); // Pass errors to central handler
    }
};

/**
 * @desc    Get single destination by ID
 * @route   GET /api/destinations/:id
 * @access  Public
 */
exports.getDestination = async (req, res, next) => {
    const { id } = req.params;
    console.log(`[getDestination] Fetching destination with ID: ${id}`);

    // Validate ID format first
    if (!isValidObjectId(id)) {
        console.warn(`[getDestination] Invalid ID format: ${id}`);
        return next({ statusCode: 400, message: `Invalid destination ID format.` });
    }

    try {
        const destination = await Destination.findById(id).lean(); // Use lean() for read-only

        if (!destination) {
            console.warn(`[getDestination] Destination not found with ID: ${id}`);
            // Use central error handler for 404
            return next({ statusCode: 404, message: `Destination not found with ID ${id}` });
        }

        console.log(`[getDestination] Destination found: ${destination.name}`);
        res.status(200).json({
            success: true,
            data: destination
        });
    } catch (err) {
        // Catch other potential errors (e.g., DB connection issues)
        console.error(`[getDestination] Error fetching destination ${id}:`, err);
        next(err);
    }
};

/**
 * @desc    Create new destination
 * @route   POST /api/destinations
 * @access  Private/Admin (Requires protect and isAdmin middleware)
 */
exports.createDestination = async (req, res, next) => {
    // Ensure req.user is present (from 'protect' middleware)
    if (!req.user || !req.user.id) {
        console.error('[createDestination] FATAL: req.user not found after protect middleware.');
        return next({ statusCode: 500, message: 'Authentication context error.' });
    }

    console.log('[createDestination] Attempting to create destination...');
    try {
        // Assign the logged-in admin's ID as the 'addedBy' field
        const dataToCreate = {
            ...req.body, // Include all fields from request body (name, desc, loc, cost, imageUrl, votingDeadline)
            addedBy: req.user.id // Overwrite/set addedBy
        };

        // --- Handle Optional votingDeadline Validation ---
        if (dataToCreate.votingDeadline && isNaN(Date.parse(dataToCreate.votingDeadline))) {
             console.warn(`[createDestination] Received invalid date format for votingDeadline: ${dataToCreate.votingDeadline}. Ignoring field.`);
             // Remove the invalid field so Mongoose doesn't try to cast it
             delete dataToCreate.votingDeadline;
        } else if (dataToCreate.votingDeadline) {
             // Convert string from datetime-local input to Date object if valid
             dataToCreate.votingDeadline = new Date(dataToCreate.votingDeadline);
             console.log(`[createDestination] Parsed votingDeadline: ${dataToCreate.votingDeadline}`);
             // Optional: Add check if date is in the past (if validator not used in schema)
             // if (dataToCreate.votingDeadline <= new Date()) {
             //      return next({ statusCode: 400, message: 'Voting deadline must be set to a future date.' });
             // }
        } else {
            // If deadline is empty string or null/undefined from body, ensure it's not set or is explicitly null
             delete dataToCreate.votingDeadline; // Or set to null if schema default isn't sufficient
        }
        // --- End Deadline Handling ---

        console.log('[createDestination] Creating document with data:', dataToCreate);
        // Create the destination document in the database
        const destination = await Destination.create(dataToCreate);

        console.log(`[createDestination] Destination created successfully: ${destination._id} - ${destination.name}`);
        res.status(201).json({ // 201 Created status
            success: true,
            data: destination
        });
    } catch (err) {
        // Catch potential validation errors from Mongoose or other DB errors
        console.error('[createDestination] Error creating destination:', err);
        // If it's a Mongoose validation error, the central handler will format it
        next(err);
    }
};

/**
 * @desc    Update destination by ID
 * @route   PUT /api/destinations/:id
 * @access  Private/Admin (Requires protect and isAdmin middleware)
 */
exports.updateDestination = async (req, res, next) => {
    const { id } = req.params;
    console.log(`[updateDestination] Attempting update for ID: ${id}`);

    // Validate ID format
    if (!isValidObjectId(id)) {
        console.warn(`[updateDestination] Invalid ID format: ${id}`);
        return next({ statusCode: 400, message: `Invalid destination ID format.` });
    }

    try {
        // Check if destination exists first (optional, findByIdAndUpdate handles non-existence)
        const existingDestination = await Destination.findById(id);
        if (!existingDestination) {
             console.warn(`[updateDestination] Destination not found with ID: ${id}`);
             return next({ statusCode: 404, message: `Destination not found with ID ${id}` });
        }
        console.log(`[updateDestination] Found destination to update: ${existingDestination.name}`);

        // Prepare update data (exclude fields that shouldn't be updated directly, like addedBy, createdAt)
        const dataToUpdate = { ...req.body };
        delete dataToUpdate.addedBy; // Prevent changing the original creator
        delete dataToUpdate.createdAt; // Prevent manual change of creation date

        // --- Handle Optional votingDeadline Update ---
        if (dataToUpdate.votingDeadline === '' || dataToUpdate.votingDeadline === null) {
             // Allow explicitly clearing the deadline by sending empty string or null
             console.log(`[updateDestination] Clearing votingDeadline for ${id}`);
             // Mongoose $unset equivalent via null
             dataToUpdate.votingDeadline = null;
        } else if (dataToUpdate.votingDeadline && isNaN(Date.parse(dataToUpdate.votingDeadline))) {
             console.warn(`[updateDestination] Received invalid date format for votingDeadline: ${dataToUpdate.votingDeadline}. Ignoring field.`);
             // Remove invalid date from update object
             delete dataToUpdate.votingDeadline;
        } else if (dataToUpdate.votingDeadline) {
             // Convert valid string to Date object
             dataToUpdate.votingDeadline = new Date(dataToUpdate.votingDeadline);
             console.log(`[updateDestination] Parsed votingDeadline for update: ${dataToUpdate.votingDeadline}`);
             // Optional: Check if date is in the past (if validator not used in schema)
             // if (dataToUpdate.votingDeadline <= new Date()) {
             //      return next({ statusCode: 400, message: 'Voting deadline must be set to a future date.' });
             // }
        }
        // If votingDeadline is not present in req.body, it simply won't be included in dataToUpdate
        // --- End Deadline Handling ---

        console.log(`[updateDestination] Updating ID ${id} with data:`, dataToUpdate);
        // Find by ID and update, run validators, return the updated document
        const updatedDestination = await Destination.findByIdAndUpdate(id, dataToUpdate, {
            new: true, // Return the modified document rather than the original
            runValidators: true, // Ensure schema validations are run on update
        });

        // findByIdAndUpdate returns null if document not found, though we checked earlier
        if (!updatedDestination) {
            console.warn(`[updateDestination] Destination ${id} disappeared during update? Not found after update attempt.`);
            return next({ statusCode: 404, message: `Destination not found with ID ${id}` });
        }

        console.log(`[updateDestination] Destination updated successfully: ${updatedDestination._id} - ${updatedDestination.name}`);
        res.status(200).json({
            success: true,
            data: updatedDestination
        });
    } catch (err) {
        // Catch Mongoose validation errors or other DB errors
        console.error(`[updateDestination] Error updating destination ${id}:`, err);
        next(err);
    }
};

/**
 * @desc    Delete destination by ID
 * @route   DELETE /api/destinations/:id
 * @access  Private/Admin (Requires protect and isAdmin middleware)
 */
exports.deleteDestination = async (req, res, next) => {
    const { id } = req.params;
    console.log(`[deleteDestination] Attempting delete for ID: ${id}`);

    // Validate ID format
    if (!isValidObjectId(id)) {
        console.warn(`[deleteDestination] Invalid ID format: ${id}`);
        return next({ statusCode: 400, message: `Invalid destination ID format.` });
    }

    try {
        // Find the destination first to ensure it exists before deleting votes
        const destination = await Destination.findById(id);
        if (!destination) {
             console.warn(`[deleteDestination] Destination not found with ID: ${id}. Cannot delete.`);
             return next({ statusCode: 404, message: `Destination not found with ID ${id}` });
        }
        console.log(`[deleteDestination] Found destination to delete: ${destination.name}. Proceeding with vote deletion...`);

        // --- Cascade Delete Votes ---
        // Delete all votes associated with this destination
        const voteDeleteResult = await Vote.deleteMany({ destination: id });
        console.log(`[deleteDestination] ${voteDeleteResult.deletedCount} associated votes deleted for destination ${id}.`);

        // --- Delete Destination ---
        // Now delete the destination document itself
        await destination.deleteOne(); // Use deleteOne() on the document instance

        console.log(`[deleteDestination] Destination ${id} deleted successfully.`);
        res.status(200).json({
            success: true,
            data: {} // Indicate success with an empty data object
        });
    } catch (err) {
        console.error(`[deleteDestination] Error deleting destination ${id}:`, err);
        next(err);
    }
};