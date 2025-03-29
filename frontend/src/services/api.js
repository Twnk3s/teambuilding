import axios from 'axios';

// Get the API base URL from environment variables
// Make sure REACT_APP_API_URL (for CRA) or VITE_API_URL (for Vite) is set in your .env file
const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.VITE_API_URL || 'http://localhost:5001/api';
// Fallback to localhost if environment variable is not set
console.log(`API Service using Base URL: ${API_BASE_URL}`); // Log the URL being used

// Create an Axios instance with default configuration
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
        // Other default headers if needed
    },
    // Example timeout:
    // timeout: 15000, // 15 seconds
});

// --- Axios Request Interceptor ---
// Runs BEFORE each request is sent using this 'api' instance.
api.interceptors.request.use(
    (config) => {
        console.log(`[Axios Request Interceptor] Sending request to: ${config.url}`); // Log outgoing URL
        // Get the token FRESH from local storage for every request
        const token = localStorage.getItem('token');

        if (token) {
            console.log('[Axios Request Interceptor] Token found, adding Authorization header.'); // Log header add
            config.headers['Authorization'] = `Bearer ${token}`;
        } else {
            console.log('[Axios Request Interceptor] No token found, Authorization header not added.'); // Log no token
            // Ensure header is removed if no token exists (might be redundant if not set previously, but safe)
             delete config.headers['Authorization'];
        }
        // Return the modified config object to proceed with the request
        return config;
    },
    (error) => {
        // Handle errors during request setup (rare)
        console.error('[Axios Request Interceptor] Error:', error);
        return Promise.reject(error); // Propagate the error
    }
);

// --- Axios Response Interceptor ---
// Runs AFTER a response is received or an error occurs.
api.interceptors.response.use(
    (response) => {
        // Status codes within 2xx range trigger this
        console.log(`[Axios Response Interceptor] Received successful response from: ${response.config.url} (Status: ${response.status})`); // Log success
        // Simply return the successful response
        return response;
    },
    (error) => {
        // Status codes outside 2xx range trigger this
        console.error(`[Axios Response Interceptor] Error response from: ${error.config?.url} (Status: ${error.response?.status})`); // Log error details
        console.error('[Axios Response Interceptor] Error data:', error.response?.data); // Log response body if available

        // --- OPTIONAL: Global 401 Handling ---
        // Check if the error response status is 401 (Unauthorized)
        // This often means the token is invalid or expired
        // if (error.response && error.response.status === 401) {
             // Avoid handling 401 specifically for login endpoint failure, as that's expected for bad credentials
        //     if (!error.config.url.includes('/auth/login')) {
        //         console.warn('[Axios Response Interceptor] Detected 401 Unauthorized (session expired?). Clearing token.');
                 // Clear token from storage
        //         localStorage.removeItem('token');
                 // Optionally trigger a logout state update via event emitter or directly if context is accessible
                 // For simplicity, usually let AuthContext's fetchUser handle this on next load/action
                 // Or redirect globally:
                 // window.location.href = '/login'; // Hard redirect
        //    }
        // }
        // --- End Optional 401 Handling ---


        // IMPORTANT: Reject the promise so the error can be caught by the specific service call's .catch() block
        return Promise.reject(error);
    }
);


// ==================================
// --- Export API endpoint functions ---
// Grouped by resource for clarity
// ==================================

// --- Auth ---
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const registerUser = (userData) => api.post('/auth/register', userData);
export const getMe = () => api.get('/auth/me'); // Used by AuthContext

// --- Destinations ---
export const fetchDestinations = () => api.get('/destinations');
export const fetchDestination = (id) => api.get(`/destinations/${id}`);
export const addDestination = (destinationData) => api.post('/destinations', destinationData); // Requires Admin
export const updateDestination = (id, destinationData) => api.put(`/destinations/${id}`, destinationData); // Requires Admin
export const deleteDestination = (id) => api.delete(`/destinations/${id}`); // Requires Admin

// --- Votes ---
export const castVote = (destinationId) => api.post('/votes', { destinationId }); // Requires User/Admin
export const fetchVoteResults = () => api.get('/votes/results'); // Public (includes user vote if logged in)
export const fetchMyVote = () => api.get('/votes/my-vote'); // Requires User/Admin
export const fetchAdminVoteDetails = () => api.get('/votes/detailed-results'); // Requires Admin

// --- Users (Optional Admin Management) ---
// export const fetchUsers = () => api.get('/users'); // Requires Admin
// export const createUserByAdmin = (userData) => api.post('/users', userData); // Requires Admin
// export const updateUserRole = (id, roleData) => api.put(`/users/${id}`, roleData); // Requires Admin
// export const deleteUser = (id) => api.delete(`/users/${id}`); // Requires Admin


// Export the configured Axios instance itself (optional, mainly for interceptor setup)
export default api;