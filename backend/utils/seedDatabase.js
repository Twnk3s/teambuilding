// Run this script manually from the 'backend' directory using: node utils/seedDatabase.js
// Or use the npm script: npm run seed

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path'); // To construct path to .env

// Load environment variables from the .env file in the backend root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Import DB connection and Models
const connectDB = require('../config/db');
const Role = require('../models/Role');
const User = require('../models/User');
const Destination = require('../models/Destination');
const Vote = require('../models/Vote');

// --- Dummy Data ---

const defaultAdmin = {
    // Include name field to match the User model
    name: process.env.DEFAULT_ADMIN_NAME || 'Administrator', // Read from env or default
    email: process.env.DEFAULT_ADMIN_EMAIL || 'admin@company.com',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'password123', // Hashed on save by model hook
};

const sampleEmployees = [
    // Include name fields
    { name: 'Alice Employee', email: 'employee1@company.com', password: 'password123' },
    { name: 'Bob Worker', email: 'employee2@company.com', password: 'password123' },
    { name: 'Charlie Staff', email: 'employee3@company.com', password: 'password123' },
];

// Function that returns destination data, taking adminUserId for the 'addedBy' field
const sampleDestinations = (adminUserId) => [
     {
        name: 'Mountain Retreat',
        description: 'A relaxing retreat in the serene mountains. Hiking, yoga, and fresh air.',
        location: 'Aspen, Colorado',
        cost: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
        addedBy: adminUserId, // Associate with the admin user who added it
    },
    {
        name: 'Beach Paradise Getaway',
        description: 'Sun, sand, and team activities on a beautiful tropical beach.',
        location: 'Maui, Hawaii',
        cost: 2500,
        imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
        addedBy: adminUserId,
    },
    {
        name: 'Urban Exploration',
        description: 'Explore a vibrant city, museums, fine dining, and cultural experiences.',
        location: 'New York City, NY',
        cost: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
        addedBy: adminUserId,
    },
     {
        name: 'Adventure Park Challenge',
        description: 'Zip-lining, rope courses, and team challenges in an outdoor adventure park.',
        location: 'Austin, Texas',
        cost: 900,
        imageUrl: 'https://images.unsplash.com/photo-1605721911519-8a760d5354c0?ixlib=rb-4.0.3&q=85&fm=jpg&crop=entropy&cs=srgb&w=600',
        addedBy: adminUserId,
    }
];


// --- Main Seeding Function ---
const seedDatabase = async () => {
    console.log('Attempting to connect to MongoDB...');
    // Check for MongoDB connection string
    if (!process.env.MONGO_URI) {
         console.error('\nERROR: MONGO_URI not found in .env file. Cannot connect to database.');
         process.exit(1); // Exit if connection string is missing
    }

    // Establish database connection
    try {
        await connectDB();
        console.log('MongoDB Connected Successfully for Seeding.');
    } catch (dbError) {
        console.error('\nERROR: Failed to connect to MongoDB:', dbError.message);
        process.exit(1); // Exit on connection failure
    }

    // Proceed with seeding data
    try {
        console.log('\n--- Starting Database Seed ---');

        // --- Step 1: Clean Database ---
        console.log('1. Clearing existing Votes and Destinations...');
        await Promise.all([
            Vote.deleteMany({}),      // Clear all votes
            Destination.deleteMany({}) // Clear all destinations
        ]);
        console.log('   Votes and Destinations cleared.');

        // Clear non-admin users (preserve the specified admin email)
        const adminEmailLower = defaultAdmin.email.toLowerCase();
        console.log(`2. Clearing non-admin users (preserving ${adminEmailLower})...`);
        const deleteResult = await User.deleteMany({ email: { $ne: adminEmailLower } });
        console.log(`   ${deleteResult.deletedCount} non-admin users deleted.`);

        // --- Step 2: Ensure Roles Exist ---
        console.log('3. Initializing/Verifying Roles (Admin, Employee)...');
        await Role.initialize(); // Use the static method defined on the Role model
        const adminRole = await Role.findOne({ name: 'Admin' }).lean(); // Use lean() for read-only object
        const employeeRole = await Role.findOne({ name: 'Employee' }).lean();
        // Critical check: Ensure roles were found/created
        if (!adminRole || !employeeRole) {
             throw new Error('FATAL: Admin or Employee role document could not be found after initialization. Check Role model and initialization logic.');
        }
        console.log(`   Roles verified (Admin ID: ${adminRole._id}, Employee ID: ${employeeRole._id}).`);

        // --- Step 3: Create or Update Default Admin User ---
        console.log(`4. Ensuring admin user (${adminEmailLower}) exists...`);
        let adminUser = await User.findOne({ email: adminEmailLower });

        if (!adminUser) {
            // Admin doesn't exist, create new one
            console.log(`   Admin user not found, creating...`);
            adminUser = await User.create({
                name: defaultAdmin.name, // Explicitly pass name
                email: adminEmailLower,  // Explicitly pass lowercase email
                password: defaultAdmin.password, // Explicitly pass password (hashed by pre-save hook)
                role: adminRole._id     // Explicitly pass role ID
            });
            console.log(`   Default admin user created (ID: ${adminUser._id}).`);
        } else {
            // Admin exists, check if update needed (name or role)
            console.log(`   Default admin user already exists (ID: ${adminUser._id}). Checking for updates...`);
            let needsSave = false;
            if (adminUser.name !== defaultAdmin.name) {
                adminUser.name = defaultAdmin.name;
                console.log(`   -> Admin name will be updated to: ${defaultAdmin.name}`);
                needsSave = true;
            }
            // Use .equals() for comparing ObjectIds
            if (!adminUser.role || !adminUser.role.equals(adminRole._id)) {
                 adminUser.role = adminRole._id;
                 console.log(`   -> Admin role will be updated to: Admin (ID: ${adminRole._id})`);
                 needsSave = true;
            }
            // Save only if changes were detected (avoids triggering hooks unnecessarily)
            if (needsSave) {
                await adminUser.save();
                console.log('   Admin user details updated.');
            } else {
                 console.log('   Admin user details are already up-to-date.');
            }
        }
        const adminUserId = adminUser._id; // Store admin ID for associating destinations

        // --- Step 4: Create Sample Employee Users ---
        console.log('5. Creating sample employee users...');
        const employeesToInsert = sampleEmployees.map(emp => ({
             name: emp.name, // Include name
             email: emp.email.toLowerCase(), // Save email lowercase
             password: emp.password, // Password will be hashed
             role: employeeRole._id // Assign employee role
        }));

        // Insert employees using insertMany, allowing continuation on duplicate errors
         try {
            const insertResult = await User.insertMany(employeesToInsert, { ordered: false });
            console.log(`   ${insertResult.length} new employee users created/processed.`); // insertMany returns array of inserted docs
         } catch (error) {
             // Handle potential bulk write errors (specifically duplicate keys)
             if (error.code === 11000 || (error.writeErrors && error.writeErrors.some(e => e.code === 11000))) {
                 console.warn('   Warning: Some employee emails might already exist. Not all sample employees may have been created.');
                 // Log more details if available from the error object
                 const successCount = error.result?.nInserted ?? 'unknown number of';
                 const errorCount = error.writeErrors?.length ?? 'unknown number of';
                 console.warn(`   (${successCount} users inserted successfully, ${errorCount} failed due to duplicates).`);
             } else {
                 // Re-throw other unexpected errors
                 console.error('   Unexpected error during employee insertion:', error);
                 throw error;
             }
         }

        // --- Step 5: Create Sample Destinations ---
        console.log('6. Creating sample destinations...');
        // Get destination data using the function, passing the admin ID
        const destinationsToInsert = sampleDestinations(adminUserId);
        // Insert destinations
        await Destination.insertMany(destinationsToInsert);
        console.log(`   ${destinationsToInsert.length} sample destinations created.`);

        // --- Completion ---
        console.log('\n--- Database Seed Completed Successfully! ---');
        process.exit(0); // Exit script with success code

    } catch (error) {
        // Catch any error that occurred during the seeding process
        console.error('\n--- ERROR DURING DATABASE SEED ---');
        console.error(error.message); // Log the error message
        // Optionally log the full error stack for more details
        // console.error(error);
        process.exit(1); // Exit script with error code
    }
};

// --- Execute the Seeding Function ---
// This line actually runs the function when the script is executed
seedDatabase();