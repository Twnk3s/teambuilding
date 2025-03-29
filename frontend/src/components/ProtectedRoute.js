import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import useAuth from '../hooks/useAuth'; // Import the hook to get auth state
import LoadingSpinner from './LoadingSpinner'; // Show spinner while checking auth

/**
 * ProtectedRoute: Ensures user is authenticated.
 * If authenticated, renders the child components/route (via Outlet or children prop).
 * If not authenticated, redirects to the login page, saving the current location
 * to allow redirection back after successful login.
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth(); // Get auth status and loading state
    const location = useLocation(); // Get current location to redirect back later

    // Show loading spinner while authentication status is being checked
    if (loading) {
        return <LoadingSpinner />;
    }

    // If user is not authenticated, redirect to login page
    if (!isAuthenticated) {
        // Pass the current location in state
        // so the login page can redirect back after success
        return <Navigate to="/login" state={{ from: location }} replace />;
        // 'replace' avoids adding the login route to the browser history stack
    }

    // If authenticated, render the nested content
    // Use Outlet if wrapping routes in App.js, use children if passing component directly
    return children ? children : <Outlet />;
};


/**
 * AdminRoute: Ensures user is authenticated AND has the 'Admin' role.
 * If conditions met, renders the child components/route.
 * If not authenticated, redirects to login.
 * If authenticated but not Admin, redirects to the home page (or another suitable page).
 */
export const AdminRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth(); // Need user object to check role
    const location = useLocation();

    // Show loading spinner while checking auth and user details
    if (loading) {
        return <LoadingSpinner />;
    }

    // Redirect to login if not authenticated at all
    if (!isAuthenticated) {
         return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // Redirect to home page if authenticated but NOT an Admin
    if (user?.role !== 'Admin') {
        console.warn('AdminRoute: User is not an admin. Redirecting.'); // Log for debugging
         // Redirect to home page, or potentially a dedicated 'unauthorized' page
         return <Navigate to="/" replace />;
    }

    // If authenticated AND is Admin, render the nested content
    return children ? children : <Outlet />;
};

// Export ProtectedRoute as the default export
export default ProtectedRoute;