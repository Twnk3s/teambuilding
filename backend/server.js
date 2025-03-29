const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const Role = require('./models/Role'); // Import the Role model
const errorHandler = require('./middleware/errorMiddleware'); // Import the error handler

// Load env vars BEFORE anything else that might need them
dotenv.config();

// Connect to database AND initialize roles afterwards
connectDB().then(async () => {
    // Initialize Roles after DB connection is successful
    // This ensures the roles collection and documents exist before the app fully starts
    await Role.initialize();

    // Optional: You could also trigger the database seeding from here if desired
    // Be cautious doing this on every server start in production!
    // if (process.env.NODE_ENV === 'development') {
    //    require('./utils/seedDatabase')();
    // }
}).catch(err => {
    // Catch potential errors during the initial connection or role initialization
    console.error('Failed during initial DB connection or Role initialization:', err);
    process.exit(1);
});


const app = express();

// --- Middlewares ---

// Body parser: Allows us to accept JSON data in the request body
app.use(express.json());

// Enable CORS - Configure properly later for production
// You might want to make this more specific later, e.g., based on CLIENT_URL env var
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL // Use env var in production (Make sure CLIENT_URL is set in .env for prod)
    : '*', // Allow all for development (adjust if needed, e.g., 'http://localhost:3000')
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true, // If you need cookies/authorization headers
};
app.use(cors(corsOptions));


// --- Basic Route (for testing) ---
app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- Mount Routers ---
app.use('/api/auth', require('./routes/authRoutes'));           // Mount Authentication routes
// app.use('/api/users', require('./routes/userRoutes'));       // Optional: Mount User management routes if created
app.use('/api/destinations', require('./routes/destinationRoutes')); // Mount Destination routes
app.use('/api/votes', require('./routes/voteRoutes'));           // Mount Vote routes

// --- Error Handler Middleware (Must be LAST middleware used BEFORE starting server) ---
app.use(errorHandler); // Use the error handler

// --- Start Server ---
const PORT = process.env.PORT || 5001;

const server = app.listen(
    PORT,
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
);

// Handle unhandled promise rejections (e.g., other DB errors after startup)
process.on('unhandledRejection', (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`);
    // Close server & exit process gracefully
    server.close(() => process.exit(1));
});

// Export the app instance if needed for testing (optional)
// module.exports = app;