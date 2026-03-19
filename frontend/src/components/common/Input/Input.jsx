import React from 'react';
import './Input.css';

const Input = ({
                   type = 'text',
                   label,
                   error,
                   icon,
                   className = '',
                   ...props
               }) => {
    return (
        <div className="input-wrapper">
            {label && <label className="input-label">{label}</label>}
            <div className="input-container">
                {icon && <span className="input-icon">{icon}</span>}
                <input
                    type={type}
                    className={`input-field ${icon ? 'with-icon' : ''} ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;