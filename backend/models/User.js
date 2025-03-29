const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Role import is needed for the 'ref' property
const Role = require('./Role'); // Ensure Role model is defined correctly

const UserSchema = new mongoose.Schema({
    // --- Name Field (Added) ---
    name: {
        type: String,
        required: [true, 'Please provide a name'], // Make name required
        trim: true, // Remove leading/trailing whitespace
        maxlength: [50, 'Name cannot exceed 50 characters'] // Optional length limit
    },
    // --- End Name Field ---

    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true, // Ensure emails are unique
        // Regular expression for basic email format validation
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address',
        ],
        lowercase: true, // Store emails in lowercase for case-insensitive lookups
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [6, 'Password must be at least 6 characters long'], // Enforce minimum length
        select: false, // IMPORTANT: Exclude password field from default query results
    },
    role: {
        type: mongoose.Schema.ObjectId, // Store the ObjectId of the associated Role document
        ref: 'Role', // Link this field to the 'Role' model
        required: [true, 'User must have an assigned role'], // Ensure role is always set
    },
    createdAt: {
        type: Date,
        default: Date.now, // Automatically set the timestamp when a user is created
    },
}, {
    // Optional: Add timestamps for automatic createdAt and updatedAt fields
    // timestamps: true
});

// --- Mongoose Middleware ---

// Hash password before saving a new user or when password is modified
UserSchema.pre('save', async function (next) {
    // Check if the password field was modified. If not, skip hashing.
    // 'this.isModified' is a Mongoose document method.
    if (!this.isModified('password')) {
        return next();
    }

    console.log(`Hashing password for user: ${this.email}`); // Log password hashing action
    try {
        // Generate salt (complexity factor = 10)
        const salt = await bcrypt.genSalt(10);
        // Hash the plain text password with the generated salt
        this.password = await bcrypt.hash(this.password, salt);
        next(); // Proceed to the next middleware/save operation
    } catch (error) {
        console.error(`Error hashing password for ${this.email}:`, error); // Log hashing errors
        next(error); // Pass the error to the error handling middleware
    }
});

// --- Mongoose Methods ---

// Add an instance method to compare entered password with the stored hash
// Call this on a user document instance: userDoc.matchPassword('plainPassword')
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // 'this.password' refers to the hashed password on the current document instance.
    // NOTE: The user document must have been fetched WITH the password field explicitly selected
    // (e.g., using .select('+password')) for 'this.password' to be available here.
    if (!this.password) {
         console.error(`matchPassword called on user ${this.email} without password field loaded.`);
         // Depending on context, might throw error or return false
         // Returning false maintains security (doesn't reveal password isn't loaded)
         return false;
    }
    try {
        // Use bcrypt.compare to securely check the passwords
        return await bcrypt.compare(enteredPassword, this.password);
    } catch (error) {
        console.error(`Error comparing password for ${this.email}:`, error);
        return false; // Return false on comparison error
    }
};


module.exports = mongoose.model('User', UserSchema);