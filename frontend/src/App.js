import React from 'react';
// Link is needed for the NotFoundPage component (even if we replace the placeholder)
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; // Import the AuthProvider

// --- Import Components ---
import Navbar from './components/Navbar';
// LoadingSpinner is imported within components/pages where needed

// --- Import Pages ---
import HomePage from './pages/HomePage';           // Import the real HomePage
import LoginPage from './pages/LoginPage';           // Import the real LoginPage
import AdminDashboard from './pages/AdminDashboard'; // Import the real AdminDashboard
import RegisterPage from './pages/RegisterPage';     // Import the real RegisterPage
import NotFoundPage from './pages/NotFoundPage';     // Import the real NotFoundPage

// --- Import Route Protection Components ---
// Import the actual components
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';

// --- Import Styles ---
import './App.css';

// --- No more placeholder pages needed here ---

function App() {
    return (
        // Wrap the entire application with AuthProvider
        <AuthProvider>
            {/* Use BrowserRouter for handling client-side routing */}
            <Router>
                {/* Render the Navbar on all pages */}
                <Navbar />

                {/* Define the main content area where pages will be rendered */}
                <main>
                    {/* Routes component manages different Route definitions */}
                    <Routes>
                        {/* --- Public Routes --- */}
                        <Route path="/" element={<HomePage />} />          {/* Using REAL HomePage */}
                        <Route path="/login" element={<LoginPage />} />        {/* Using REAL LoginPage */}
                        <Route path="/register" element={<RegisterPage />} />  {/* Using REAL RegisterPage */}

                        {/* --- Protected Routes (Example structure, refine later) --- */}
                        {/* Example: A generic protected route using the imported component */}
                        {/* <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} /> */}

                        {/* --- Admin Routes --- */}
                        {/* Use the REAL AdminRoute wrapper */}
                        {/* Using REAL AdminDashboard */}
                        <Route
                            path="/admin"
                            element={
                                <AdminRoute> {/* Using REAL AdminRoute */}
                                    <AdminDashboard /> {/* Using REAL AdminDashboard */}
                                </AdminRoute>
                            }
                        />

                        {/* --- Catch-all Route for 404 Not Found --- */}
                        {/* Using REAL NotFoundPage */}
                        <Route path="*" element={<NotFoundPage />} />

                    </Routes>
                </main>
            </Router>
        </AuthProvider>
    );
}

export default App;