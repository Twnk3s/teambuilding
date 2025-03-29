import React, { useState, useEffect } from 'react';
// Consolidate imports from react-router-dom
import { useNavigate, useLocation, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Import the auth hook
import LoadingSpinner from '../components/LoadingSpinner'; // Import spinner

// No placeholder spinner needed

const LoginPage = () => {
    // Local state for form inputs
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Get auth functions and state from context
    const { login, loading, error, isAuthenticated, setError } = useAuth();

    const navigate = useNavigate();
    const location = useLocation();

    // Determine where to redirect after login
    // If user was redirected to login (e.g., trying to access protected route), 'location.state.from' might exist
    const from = location.state?.from?.pathname || "/"; // Default to home page

    // If user is already authenticated, redirect them away from login page
    useEffect(() => {
        if (isAuthenticated) {
            navigate(from, { replace: true }); // Use replace to avoid login page in history
        }
        // Clear any previous auth errors when component mounts
        // This prevents showing old errors if user navigates back to login
        // Only clear if navigating TO login page, might clear valid errors otherwise if logic changes
        // Consider clearing error only onSubmit instead if needed
        setError(null);
         // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, navigate, from]); // Dependency array


    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent standard form submission
        setError(null); // Clear previous errors before attempting login

        if (!email || !password) {
            setError("Please enter both email and password."); // Basic client-side validation
            return;
        }

        // Call the login function from AuthContext
        const success = await login(email, password);

        if (success) {
            // Redirect to the originally intended page or home page upon success
            navigate(from, { replace: true });
        }
        // If login fails, the 'error' state in AuthContext will be set,
        // and the error message will be displayed below.
    };

    return (
        <div className="form-container"> {/* Use class from App.css */}
            <h1>Login</h1>

            {/* Display loading spinner while login is in progress */}
            {loading && <LoadingSpinner />}

            {/* Display error message if login fails */}
            {error && <div className="alert alert-danger">{error}</div>}

            {/* Hide form while loading to prevent double submission */}
            {!loading && (
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            className="form-control" // Use class from index.css
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required // HTML5 validation
                            autoComplete="email"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                        {loading ? 'Logging In...' : 'Login'}
                    </button>
                </form>
            )}

            {/* Link to registration page (Now active) */}
            {/* Display only when not loading */}
            {!loading && (
                <p className="my-1 text-center">
                    Don't have an account? <Link to="/register">Register Here</Link>
                </p>
            )}
        </div>
    );
};

export default LoginPage;