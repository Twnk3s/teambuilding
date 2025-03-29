import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom'; // Use NavLink for active styling
import useAuth from '../hooks/useAuth'; // Import the useAuth hook

const Navbar = () => {
    // Use the custom hook to get auth state and functions
    const { user, isAuthenticated, loading, logout } = useAuth(); // Get real auth state

    // Determine if the user is an admin (only if user object exists)
    const isAdmin = user?.role === 'Admin'; // Safely access role using optional chaining

    const navigate = useNavigate(); // Hook for programmatic navigation

    // Handler for the logout button click
    const handleLogout = () => {
        console.log('[Navbar] handleLogout called.'); // Log click
        logout(); // Dispatch the logout action from AuthContext
        // Redirect to login page after logout action is processed
        // State updates might take a render cycle, but navigate should work okay here
        navigate('/login');
    };

    // Define CSS classes for NavLink active/inactive states
    const getNavLinkClass = ({ isActive }) => {
        // Combine base class with active class if the link is active
        return isActive ? 'nav-link active' : 'nav-link';
    };

    return (
        <nav className="navbar">
            <div className="container">
                {/* Brand Logo/Link - always visible */}
                <Link to="/" className="navbar-brand">
                   🏢 TeamVote {/* Simple branding */}
                </Link>

                {/* Navigation Links section */}
                <div className="navbar-links">
                    <ul>
                        {/* Home Link - always visible */}
                        <li>
                            <NavLink to="/" className={getNavLinkClass}>
                                Home
                            </NavLink>
                        </li>

                        {/* Conditional Links based on Authentication Status and Loading State */}

                        {/* Case 1: Auth state is currently loading */}
                        {loading && (
                            <li><span className="user-info loading-indicator">Loading...</span></li>
                        )}

                        {/* Case 2: Auth state finished loading AND user is authenticated */}
                        {!loading && isAuthenticated && (
                            <>
                                {/* Admin Dashboard Link (only render if user is Admin) */}
                                {isAdmin && (
                                    <li>
                                        <NavLink to="/admin" className={getNavLinkClass}>
                                            Admin Dashboard
                                        </NavLink>
                                    </li>
                                )}

                                {/* Display User Info (Name or Email) */}
                                {user && (
                                    <li>
                                        {/* Display user's name, fallback to email if name is missing */}
                                        <span className="user-info">
                                            {user.name || user.email} ({user.role})
                                        </span>
                                    </li>
                                )}

                                {/* Logout Button */}
                                <li>
                                    {/* Style the button to look like other nav links */}
                                    <button onClick={handleLogout} className="btn btn-link nav-link">
                                        Logout
                                    </button>
                                </li>
                            </>
                        )}

                        {/* Case 3: Auth state finished loading AND user is NOT authenticated */}
                        {!loading && !isAuthenticated && (
                            <>
                                {/* Login Link */}
                                <li>
                                    <NavLink to="/login" className={getNavLinkClass}>
                                        Login
                                    </NavLink>
                                </li>
                                {/* Registration Link (Optional) */}
                                <li>
                                    <NavLink to="/register" className={getNavLinkClass}>
                                        Register
                                    </NavLink>
                                </li>
                            </>
                         )}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

// CSS Reminder (ensure these or similar styles exist in App.css or index.css)
/*
.navbar { background-color: var(--dark-color); color: #fff; padding: 0.8rem 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.navbar .container { display: flex; justify-content: space-between; align-items: center; }
.navbar-brand { color: #fff; text-decoration: none; font-size: 1.5rem; font-weight: bold; }
.navbar-brand:hover { color: #ddd; text-decoration: none; }
.navbar-links ul { list-style: none; padding: 0; margin: 0; display: flex; align-items: center; }
.navbar-links li { margin-left: 1.2rem; }
.nav-link {
    color: rgba(255, 255, 255, 0.85);
    text-decoration: none;
    padding: 0.3rem 0.5rem;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1rem;
    transition: color 0.15s ease-in-out;
    display: inline-block; /* Ensure button aligns well */
    /*vertical-align: middle;
}
.nav-link:hover { color: #fff; }
.nav-link.active { color: #fff; font-weight: bold; border-bottom: 2px solid var(--primary-color); padding-bottom: calc(0.3rem - 2px); } /* Example active style */
/*button.nav-link { line-height: inherit; } /* Ensure button text aligns */
/*.user-info { color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; font-style: italic; display: inline-block; vertical-align: middle; margin-right: 0.5rem; }
.loading-indicator { font-style: italic; color: rgba(255, 255, 255, 0.7); }
*/

export default Navbar;