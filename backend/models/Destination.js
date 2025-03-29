const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a destination name'],
        trim: true, // Remove leading/trailing whitespace
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
    },
    location: {
        type: String,
        required: [true, 'Please add a location'],
        trim: true,
    },
    cost: {
        type: Number,
        required: [true, 'Please add an estimated cost (numeric value)'],
        min: [0, 'Cost cannot be negative'] // Ensure cost is not negative
    },
    imageUrl: {
        type: String,
        trim: true,
        // Optional: Add validation for URL format if needed using match
        // match: [/^(http|https):\/\/[^ "]+$/, 'Please use a valid URL for the image']
        default: null // Default to null if no URL is provided
    },
    addedBy: {
        // Store the ObjectId of the User (Admin) who added this destination
        type: mongoose.Schema.ObjectId,
        ref: 'User', // Reference the 'User' model for population
        required: [true, 'Destination must be associated with a user (addedBy).'], // Ensure we know who added it
    },
    // --- Voting Deadline Field (Added) ---
    votingDeadline: {
        type: Date,
        required: false, // Make it optional (can be null)
        // Optional: Add a validator to ensure the deadline is in the future if set?
        // validate: {
        //     validator: function(value) {
        //         // 'this' refers to the document being saved/updated
        //         // Allow null/undefined, but if a date is set, it must be after now
        //         return !value || value > new Date();
        //     },
        //     message: 'Voting deadline must be set to a future date.'
        // }
    },
    // --- End Voting Deadline Field ---

    // Moved createdAt to schema options for consistency (optional)
    // createdAt: {
    //     type: Date,
    //     default: Date.now,
    // },
}, {
    // Use Mongoose's built-in timestamps option
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

// --- Indexes (Optional but Recommended) ---
// Index common query fields if needed for performance on large datasets
// DestinationSchema.index({ location: 1 });
// DestinationSchema.index({ cost: 1 });

module.exports = mongoose.model('Destination', DestinationSchema);