const mongoose = require('mongoose');

const VoteSchema = new mongoose.Schema({
    user: {
        // The user who cast the vote
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Vote must belong to a user'],
    },
    destination: {
        // The destination being voted for
        type: mongoose.Schema.ObjectId,
        ref: 'Destination',
        required: [true, 'Vote must be for a destination'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// --- Indexes ---

// Prevent a user from voting more than once.
// This creates a unique index on the 'user' field. If someone tries to create
// a second vote document with the same user ObjectId, MongoDB will reject it.
VoteSchema.index({ user: 1 }, { unique: true });

// Optional: Index destination for faster querying of votes per destination
VoteSchema.index({ destination: 1 });

// --- Cascade Delete (Optional - Handled in Controller for now) ---
// If you wanted votes to be automatically deleted when a User or Destination is deleted,
// you could add pre-remove middleware hooks here or on the User/Destination models.
// However, for this project, we'll handle vote deletion within the Destination controller's
// delete function for simplicity when a destination is removed.

module.exports = mongoose.model('Vote', VoteSchema);