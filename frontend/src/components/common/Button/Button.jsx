import React from 'react';
import './Button.css';

const Button = ({
                    children,
                    variant = 'primary',
                    size = 'medium',
                    fullWidth = false,
                    onClick,
                    ...props
                }) => {
    return (
        <button
            className={`btn btn-${variant} btn-${size} ${fullWidth ? 'btn-full' : ''}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;