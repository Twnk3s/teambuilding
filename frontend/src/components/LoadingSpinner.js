import React from 'react';
// Assumes spinner CSS (.spinner-container, .spinner) is defined in index.css or App.css

const LoadingSpinner = ({ size = '36px' }) => ( // Optional size prop
    <div className="spinner-container">
        <div className="spinner" style={{ width: size, height: size }}></div>
    </div>
);

export default LoadingSpinner;