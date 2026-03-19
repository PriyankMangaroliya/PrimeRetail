import React from 'react';
import './Badge.css';

const Badge = ({ children, variant = 'primary', className = '' }) => {
    return (
        <span className={`badge badge-${variant} ${className}`}>
      {children}
    </span>
    );
};

export default Badge;