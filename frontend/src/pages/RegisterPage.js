import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // Import Link for login redirect
import useAuth from '../hooks/useAuth'; // Import the auth hook
import LoadingSpinner from '../components/LoadingSpinner'; // Import spinner

const RegisterPage = () => {
    // --- State for Form Inputs ---
    // Add state for the 'name' field
    const [name, setName] = useState(''); // <-- ADDED name state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    // Removed localError state, using error from useAuth context directly

    // --- Get Auth Context ---
    // Destructure register function and relevant state variables
    const { register, loading, error, isAuthenticated, setError } = useAuth();

    // --- Hooks for Navigation ---
    const navigate = useNavigate();
    const location = useLocation();

    // Determine redirect path after successful registration
    const from = location.state?.from?.pathname || "/"; // Default to home page

    // --- Effect Hooks ---
    // Redirect if already logged in
    useEffect(() => {
        if (isAuthenticated) {
            console.log('[RegisterPage] User already authenticated, redirecting...');
            navigate(from, { replace: true }); // Use replace to avoid register page in history
        }
    }, [isAuthenticated, navigate, from]);

    // Clear auth errors when the component mounts or unmounts
    useEffect(() => {
        // Clear error when component mounts
        console.log('[RegisterPage] Component mounted, clearing auth error.');
        setError(null);

        // Cleanup function to clear error when component unmounts
        return () => {
            // Check if setError is still valid (component might unmount rapidly)
             if (typeof setError === 'function') {
                  // Optional: Decide if clearing on unmount is desired.
                  // It might clear an error message the user didn't see if they navigate away quickly.
                  // setError(null);
                  console.log('[RegisterPage] Component unmounting.'); // Log unmount
             }
        };
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [setError]); // Dependency array includes setError from context

    // --- Event Handlers ---
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior
        console.log('[RegisterPage] Handle submit triggered.');
        setError(null); // Clear previous errors before attempting registration

        // --- Client-Side Validation ---
        if (!name || !email || !password || !confirmPassword) { // <-- ADDED name check
            console.warn('[RegisterPage] Validation failed: Missing fields.');
            setError("Please fill in all fields (Name, Email, Password, Confirm Password).");
            return;
        }
        if (password.length < 6) {
            console.warn('[RegisterPage] Validation failed: Password too short.');
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            console.warn('[RegisterPage] Validation failed: Passwords do not match.');
            setError("Passwords do not match.");
            return;
        }
        // Basic email format check (optional, backend validates more strictly)
        // const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
        // if (!emailRegex.test(email)) {
        //    setError("Please enter a valid email address.");
        //    return;
        // }

        // --- Call Registration API ---
        console.log(`[RegisterPage] Calling register function with: Name=${name}, Email=${email}`);
        // Call the register function from AuthContext, passing name, email, password
        const success = await register(name, email, password); // <-- PASS name

        if (success) {
            console.log('[RegisterPage] Registration successful! Navigating...');
            // Redirect on successful registration
            navigate(from, { replace: true });
        } else {
            // If registration fails, the 'error' state in AuthContext should be set
            // by the register function itself. Log this occurrence.
            console.log('[RegisterPage] Registration failed (error should be set in context).');
        }
    };

    // --- JSX ---
    return (
        <div className="form-container"> {/* Use class from App.css */}
            <h1>Register Employee Account</h1>

            {/* Display loading spinner while registration is processing */}
            {loading && <LoadingSpinner />}

            {/* Display error message from AuthContext */}
            {error && !loading && <div className="alert alert-danger">{error}</div>}

            {/* Hide form while loading to prevent double submission */}
            {!loading && (
                <form onSubmit={handleSubmit} noValidate> {/* Add noValidate */}
                    {/* --- Name Input Field --- */}
                    <div className="form-group">
                        <label htmlFor="name">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            className="form-control" // Use standard form control class
                            value={name}
                            onChange={(e) => setName(e.target.value)} // Update name state
                            required // HTML5 validation
                            autoComplete="name" // Browser autocomplete hint
                            disabled={loading} // Disable during loading
                        />
                    </div>
                    {/* --- End Name Input Field --- */}

                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password (min. 6 characters)</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength="6" // HTML5 validation
                            autoComplete="new-password" // Hint for password managers
                            disabled={loading}
                        />
                    </div>
                     <div className="form-group">
                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            className="form-control"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            autoComplete="new-password"
                            disabled={loading}
                        />
                    </div>
                    {/* Submit Button */}
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Registering...' : 'Register'}
                    </button>
                </form>
            )}

            {/* Link to Login page - display only when not loading */}
            {!loading && (
                <p className="my-1 text-center">
                    Already have an account? <Link to="/login">Login Here</Link>
                </p>
            )}
        </div>
    );
};

export default RegisterPage;