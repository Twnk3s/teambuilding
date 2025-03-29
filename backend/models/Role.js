const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['Admin', 'Employee'], // Enforce specific roles
    },
});

// Static method on the Role model to ensure Admin and Employee roles exist
// This is useful for initializing the database the first time or in seeding
RoleSchema.statics.initialize = async function() {
    try {
        const count = await this.countDocuments();
        if (count === 0) {
            await this.create([{ name: 'Admin' }, { name: 'Employee' }]);
            console.log('Admin and Employee roles initialized in the database.');
        } else {
            // Optional: Verify existing roles if needed, but for simplicity, we assume they are correct if count > 0
            console.log('Roles already exist or initialization check passed.');
        }
    } catch (error) {
        console.error('Error initializing roles:', error);
        // Depending on the app's needs, you might want to throw the error or handle it differently
    }
};

module.exports = mongoose.model('Role', RoleSchema);