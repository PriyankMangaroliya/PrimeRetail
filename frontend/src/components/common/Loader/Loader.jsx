import React from 'react';
import './Loader.css';

const Loader = ({ size = 'medium', fullScreen = false }) => {
    return (
        <div className={`loader-container ${fullScreen ? 'fullscreen' : ''}`}>
            <div className={`loader loader-${size}`}>
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="spinner-blade"></div>
                ))}
            </div>
        </div>
    );
};

export default Loader;