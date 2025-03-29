import React, { createContext, useState, useEffect, useCallback } from 'react';
// Import the real API service and specific functions needed
import api, { getMe } from '../services/api';

// Create the context object
const AuthContext = createContext(null); // Initialize context with null

// Create the Provider component
export const AuthProvider = ({ children }) => {
    // State for user object, token string, loading status, and errors
    const [user, setUser] = useState(null);
    // Read token from localStorage ONLY on initial mount using function initializer
    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(true); // Start loading until initial user check is done
    const [error, setError] = useState(null); // Store auth-related errors

    // --- DEBUGGING LOG ---
    // Logs on every render, useful for tracking state changes
    // console.log('AuthProvider Render - State:', { token, user: user ? { name: user.name, email: user.email, role: user.role } : null, loading, error });

    // Function to fetch user data based on the current token state
    const fetchUser = useCallback(async () => {
        console.log('[fetchUser] Called. Current token state:', token ? 'Exists' : 'Null');
        if (!token) {
            console.log('[fetchUser] No token found. Ensuring logged out state.');
            setUser(null);
            delete api.defaults.headers.common['Authorization']; // Ensure header removed if no token
            setLoading(false);
            return;
        }

        console.log('[fetchUser] Token exists. Setting loading, clearing error, setting header.');
        setLoading(true);
        setError(null);
        // Explicitly set header based on current token state for this fetch attempt
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        try {
            console.log('[fetchUser] Calling getMe() API...');
            const response = await getMe(); // Backend should return { success: true, user: { ... } }
            console.log('[fetchUser] getMe() API response:', response.data);

            // Validate response structure and success flag
            if (response.data?.success && response.data?.user) {
                console.log('[fetchUser] Success! Setting user state:', response.data.user);
                setUser(response.data.user); // Set user state
            } else {
                 // Handle unexpected success=false or missing user data
                 console.warn('[fetchUser] API success flag false or user data missing in response.');
                 throw new Error(response.data?.message || 'Failed to validate session.');
            }
        } catch (err) {
            // Handle API call errors (network, 4xx, 5xx)
            console.error("[fetchUser] ERROR caught:", err.message);
            // Optionally log more details for non-generic errors
            if (err.response) {
                console.error("[fetchUser] Error Response:", { status: err.response.status, data: err.response.data });
            }
            setError(err.response?.data?.message || err.message || 'Session invalid or expired. Please log in.');
            // Clear invalid state if fetch fails
            console.log('[fetchUser] Clearing invalid state (user, token, localStorage, header).');
            setUser(null);
            setToken(null); // This triggers re-render and potentially useEffect again, but fetchUser exits early if token is null
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
        } finally {
            console.log('[fetchUser] Setting loading=false.');
            setLoading(false); // Ensure loading is always set to false
        }
    }, [token]); // Dependency: re-run ONLY if token state changes

    // Effect to run fetchUser on initial mount (checks localStorage token via initial state)
    useEffect(() => {
        console.log('AuthProvider Mount Effect [fetchUser] running...');
        fetchUser();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run only ONCE on mount (fetchUser itself depends on token state via useCallback)


    // Login function
    const login = async (email, password) => {
        console.log('[login] Attempting login...');
        setLoading(true);
        setError(null);
        try {
            const response = await api.post('/auth/login', { email, password });
            console.log('[login] API response:', response.data);
            // Validate response structure
            if (!response.data?.success || !response.data?.token || !response.data?.user) {
                 throw new Error('Invalid response structure from login endpoint.');
            }
            const { token: newToken, user: loggedInUser } = response.data;

            console.log('[login] Success! Persisting token, setting state.');
            localStorage.setItem('token', newToken); // Persist token FIRST
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Update default header
            setUser(loggedInUser); // Update user state
            setToken(newToken); // Update token state LAST (will trigger re-render)
            setLoading(false);
            return true; // Indicate login success

        } catch (err) {
            console.error("[login] ERROR caught:", err.message);
            if (err.response) {
                console.error("[login] Error Response:", { status: err.response.status, data: err.response.data });
            }
            const message = err.response?.data?.message || err.message || 'Login failed. Please check credentials.';
            setError(message);
            // Ensure state is cleared on login failure
            console.log('[login] Clearing potentially invalid state due to error.');
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            delete api.defaults.headers.common['Authorization'];
            setLoading(false);
            return false; // Indicate login failure
        }
    };

    // Logout function
    const logout = () => {
        console.log('[logout] Logging out...');
        // Clear state and storage
        setUser(null);
        setToken(null); // Setting token to null will eventually trigger fetchUser which confirms logged out state
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
        setError(null); // Clear any previous errors
        console.log('[logout] State and localStorage cleared.');
        // Navigation should be handled in the component calling logout (e.g., Navbar)
    };

    // Register function - updated to accept 'name'
    // Make sure the function signature matches how it's called in RegisterPage
    const register = async (name, email, password) => { // <-- Added 'name' parameter
         console.log('[register] Attempting registration...');
         setLoading(true);
         setError(null);
         try {
             // Pass name, email, password object to API
             const response = await api.post('/auth/register', { name, email, password }); // <-- Pass name in object
             console.log('[register] API response:', response.data);
             // Validate response
             if (!response.data?.success || !response.data?.token || !response.data?.user) {
                 throw new Error('Invalid response structure from register endpoint.');
             }
             const { token: newToken, user: registeredUser } = response.data;

             console.log('[register] Success! Persisting token, setting state.');
             localStorage.setItem('token', newToken); // Persist token FIRST
             api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Update header
             setUser(registeredUser); // Set user state
             setToken(newToken); // Set token state LAST
             setLoading(false);
             return true; // Indicate register success

         } catch (err) {
             console.error("[register] ERROR caught:", err.message);
             if (err.response) {
                console.error("[register] Error Response:", { status: err.response.status, data: err.response.data });
             }
             const message = err.response?.data?.message || err.message || 'Registration failed.';
             setError(message);
             // Ensure state is cleared on register failure
             console.log('[register] Clearing potentially invalid state due to error.');
             setUser(null);
             setToken(null);
             localStorage.removeItem('token');
             delete api.defaults.headers.common['Authorization'];
             setLoading(false);
             return false; // Indicate register failure
         }
    };

    // Value object provided by the context
    const contextValue = {
        user,
        token,
        isAuthenticated: !!user && !!token, // User is authenticated if both user object and token exist
        loading, // Represents the loading state of auth operations (login, register, fetchUser)
        error, // Stores the latest authentication-related error message
        login, // Function to call for logging in
        logout, // Function to call for logging out
        register, // Function to call for registration
        fetchUser, // Function to manually re-validate token/user (rarely needed)
        setError // Function to manually set/clear the error state (use with caution)
    };

    // Render the provider wrapping its children, making contextValue available via useAuth hook
    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Export the context itself (less common to use directly)
export default AuthContext;