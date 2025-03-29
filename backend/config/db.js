const mongoose = require('mongoose');
require('dotenv').config(); // Ensure dotenv is configured early

const connectDB = async () => {
    try {
        // Ensure MONGO_URI is loaded correctly
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI not found in environment variables. Make sure .env file is set up correctly.');
        }
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting to MongoDB: ${error.message}`);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;