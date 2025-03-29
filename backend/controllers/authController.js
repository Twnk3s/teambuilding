const User = require('../models/User');
const Role = require('../models/Role');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        console.error('FATAL ERROR: JWT_SECRET is not defined.');
        // Throwing an error might be better in production to halt faulty operation
        throw new Error('JWT Secret not configured.');
        // return null; // Or return null to handle it downstream
    }
    try {
        return jwt.sign({ id }, process.env.JWT_SECRET, {
            expiresIn: '30d', // e.g., 30 days
        });
    } catch (error) {
         console.error('Error signing JWT:', error);
         throw new Error('Token signing failed.'); // Propagate error
    }
};

/**
 * @desc    Register a new user (as Employee by default)
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res, next) => {
    // Destructure name, email, password from request body
    const { name, email, password } = req.body;
    console.log(`[register] Attempting registration for: Name='${name}', Email='${email}'`);

    try {
        // --- Input Validation ---
        if (!name || !email || !password) {
            console.warn('[register] Validation failed: Missing name, email, or password.');
            // Pass error object to central handler
            return next({ statusCode: 400, message: 'Please provide name, email, and password' });
        }
        if (password.length < 6) {
            console.warn('[register] Validation failed: Password too short.');
            return next({ statusCode: 400, message: 'Password must be at least 6 characters' });
        }

        // --- Check for Existing User ---
        const lowerCaseEmail = email.toLowerCase(); // Standardize email case
        console.log(`[register] Checking existence for email: ${lowerCaseEmail}`);
        // Use lean() for performance if only checking existence
        const existingUser = await User.findOne({ email: lowerCaseEmail }).lean();
        if (existingUser) {
            console.warn(`[register] Email already registered: ${lowerCaseEmail}`);
            return next({ statusCode: 400, message: 'Email is already registered' });
        }
        console.log(`[register] Email ${lowerCaseEmail} is available.`);

        // --- Find Default Role ---
        console.log("[register] Finding 'Employee' role...");
        const employeeRole = await Role.findOne({ name: 'Employee' }).lean();
        if (!employeeRole) {
            console.error("[register] FATAL: 'Employee' role document not found in database.");
            // This is a server config issue, return 500
            return next({ statusCode: 500, message: "Server configuration error: Default role missing." });
        }
        console.log(`[register] 'Employee' role found (ID: ${employeeRole._id}).`);

        // --- Create User Document ---
        console.log(`[register] Creating user document for ${lowerCaseEmail}...`);
        // Let the pre-save hook handle password hashing
        const user = await User.create({
            name, // name from req.body
            email: lowerCaseEmail,
            password, // Plain password, will be hashed by hook
            role: employeeRole._id // Assign the found role ID
        });
        console.log(`[register] User document created successfully (ID: ${user._id}).`);

        // --- Generate Token ---
        console.log(`[register] Generating token for user ${user._id}...`);
        const token = generateToken(user._id); // Call helper function
        console.log(`[register] Token generated.`);

        // --- Prepare Response Data ---
        // Fetch user data again *without* password, *with* populated role name
        console.log(`[register] Fetching created user data for response...`);
        // Select '-password' is implicit here as it's select:false in schema, but being explicit doesn't hurt
        const userResponse = await User.findById(user._id).populate('role', 'name').lean(); // Use lean()
        if (!userResponse || !userResponse.role) {
             // Should not happen if create succeeded, but check for safety
             console.error(`[register] Failed to fetch user or populate role after creation for ${user._id}.`);
             return next({ statusCode: 500, message: "Error retrieving user details after registration." });
        }
        console.log(`[register] User data prepared for response.`);

        // --- Send Success Response ---
        res.status(201).json({ // 201 Created
            success: true,
            token,
            user: { // Include name in the response
                _id: userResponse._id,
                name: userResponse.name, // <-- Include name
                email: userResponse.email,
                role: userResponse.role.name
            }
        });
        console.log(`[register] Registration successful for ${userResponse.name} (${userResponse.email}).`);

    } catch (err) {
        // Catch unexpected errors during the process
        console.error('[register] Unexpected error during registration:', err);
        // Pass the error to the central error handling middleware
        next(err);
    }
};


/**
 * @desc    Authenticate user & get token (Login)
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    const lowerCaseEmail = email ? email.toLowerCase() : null; // Handle potential missing email early
    console.log(`[login] Attempting login for email: ${lowerCaseEmail}`);

    try {
        // --- Input Validation ---
        if (!lowerCaseEmail || !password) {
            console.warn('[login] Validation failed: Missing email or password.');
            return next({ statusCode: 400, message: 'Please provide email and password' });
        }

        // --- Find User by Email ---
        console.log(`[login] Finding user by email: ${lowerCaseEmail}...`);
        // Must select '+password' as it's excluded by default in the schema
        // Populate role to get role details in the response
        const user = await User.findOne({ email: lowerCaseEmail }).select('+password').populate('role');

        // --- Check if User Exists ---
        if (!user) {
            console.warn(`[login] User not found for email: ${lowerCaseEmail}.`);
            // Return generic 'Invalid credentials' for security (don't reveal if email exists)
            return next({ statusCode: 401, message: 'Invalid credentials' });
        }
        console.log(`[login] User found: ${user.email}. Role populated: ${user.role ? user.role.name : 'FAILED_TO_POPULATE'}.`);

        // --- Compare Passwords ---
        console.log(`[login] Comparing entered password with stored hash for user ${user.email}...`);
        if (typeof user.matchPassword !== 'function') {
             // Safety check for model method existence
             console.error(`[login] FATAL: user.matchPassword is not a function. Check User model.`);
             return next({ statusCode: 500, message: 'Server authentication configuration error.' });
        }
        const isMatch = await user.matchPassword(password);
        console.log(`[login] Password match result: ${isMatch}`);

        if (!isMatch) {
            console.warn(`[login] Password mismatch for user ${user.email}.`);
            return next({ statusCode: 401, message: 'Invalid credentials' });
        }
        console.log(`[login] Password matched successfully.`);

        // --- Verify Role Population ---
        // Check after confirming password match
        if (!user.role || !user.role.name) {
             console.error(`[login] User ${user.email} authenticated, but role population failed or role has no name.`);
             // This indicates a potential data integrity or schema setup issue
             return next({ statusCode: 500, message: 'Login failed: User role configuration error.' });
        }
        console.log(`[login] User role confirmed: '${user.role.name}'. Proceeding with token generation...`);

        // --- Generate Token ---
        console.log(`[login] Generating token for user ${user._id}...`);
        const token = generateToken(user._id);
        console.log(`[login] Token generated.`);

        // --- Send Success Response ---
        res.status(200).json({
            success: true,
            token,
            user: { // Include name in the response
                _id: user._id,
                name: user.name, // <-- Include name
                email: user.email,
                role: user.role.name
            }
        });
        console.log(`[login] Login successful for ${user.name} (${user.email}). Token sent.`);

    } catch (err) {
        // Catch unexpected errors
        console.error('[login] Unexpected error during login:', err);
        next(err); // Pass to central error handler
    }
};


/**
 * @desc    Get current logged in user details
 * @route   GET /api/auth/me
 * @access  Private (Requires 'protect' middleware)
 */
exports.getMe = async (req, res, next) => {
    // 'protect' middleware should have already attached the user document (with role populated) to req.user
    console.log(`[getMe] Request received. User from middleware: ${req.user?._id || 'Not Found'}`);

    try {
        // --- Validate req.user ---
        if (!req.user || !req.user.id) {
            // Should be caught by 'protect', but double-check
            console.error('[getMe] Error: req.user object not found after protect middleware.');
            return next({ statusCode: 401, message: 'Not authorized (user session not found)' });
        }
        // --- Validate Role ---
         if (!req.user.role || !req.user.role.name) {
             console.error(`[getMe] User ${req.user.email} found, but role is missing or not populated.`);
             return next({ statusCode: 500, message: 'Server error retrieving user role details.' });
         }
        // --- Validate Name (Added) ---
         if (!req.user.name) {
             console.warn(`[getMe] User ${req.user.email} found, but name field is missing.`);
             // Decide if this is an error or just return available data
             // For now, return data but log warning
         }

        // --- Send Success Response ---
        console.log(`[getMe] Returning data for ${req.user.name || req.user.email} (ID: ${req.user._id}), Role: ${req.user.role.name}`);
        res.status(200).json({
            success: true,
            user: { // Consistent response structure
                 _id: req.user._id,
                 name: req.user.name || 'Name not set', // <-- Include name, provide fallback
                 email: req.user.email,
                 role: req.user.role.name
            }
        });
    } catch(err) {
         console.error("[getMe] Unexpected error:", err);
         next(err);
    }
};