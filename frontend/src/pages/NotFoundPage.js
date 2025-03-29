import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation

const NotFoundPage = () => {
    return (
        // Use container and utility classes for layout and styling
        <div className="container text-center my-2 not-found">
            {/* You can add an icon or image here if desired */}
            <h1>404 - Page Not Found</h1>
            <p>Sorry, the page you are looking for does not exist or may have been moved.</p>
            {/* Link back to the home page */}
            <Link to="/" className="btn btn-primary">
                Go Back Home
            </Link>
        </div>
    );
};

export default NotFoundPage;