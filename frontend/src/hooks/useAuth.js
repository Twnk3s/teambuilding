import { useContext } from 'react';
import AuthContext from '../context/AuthContext'; // Import the context created earlier

/**
 * Custom hook to access the Authentication context.
 * Provides a clean way to get user, loading state, errors, and auth functions.
 * Throws an error if used outside of an AuthProvider.
 */
const useAuth = () => {
    // Use React's useContext hook to get the value from AuthContext
    const context = useContext(AuthContext);

    // Add a check to ensure the hook is used within the AuthProvider tree
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
        // This prevents trying to access context values when they are undefined,
        // which would happen if a component using this hook isn't wrapped by AuthProvider.
    }

    // Return the context value (which contains user, loading, login, logout, etc.)
    return context;
};

export default useAuth; // Export the custom hook