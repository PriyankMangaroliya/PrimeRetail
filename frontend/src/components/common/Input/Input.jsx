import React from 'react';
import './Input.css';

const Input = ({
                   type = 'text',
                   label,
                   error,
                   icon,
                   suffix,
                   className = '',
                   ...props
               }) => {
    return (
        <div className="input-wrapper">
            {label && <label className="input-label">{label}</label>}
            <div className="input-container">
                {icon && <span className="input-icon left">{icon}</span>}
                <input
                    type={type}
                    className={`input-field ${icon ? 'with-icon' : ''} ${suffix ? 'with-suffix' : ''} ${error ? 'input-error' : ''} ${className}`}
                    {...props}
                />
                {suffix && <span className="input-icon right">{suffix}</span>}
            </div>
            {error && <span className="input-error-message">{error}</span>}
        </div>
    );
};

export default Input;