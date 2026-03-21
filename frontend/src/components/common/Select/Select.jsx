import React from 'react';
import './Select.css';

const Select = ({
                    label,
                    error,
                    icon,
                    options = [],
                    className = '',
                    ...props
                }) => {
    return (
        <div className="select-wrapper">
            {label && <label className="select-label">{label}</label>}
            <div className="select-container">
                {icon && <span className="select-icon">{icon}</span>}
                <select
                    className={`select-field ${icon ? 'with-icon' : ''} ${error ? 'select-error' : ''} ${className}`}
                    {...props}
                >
                    {options.map((option, index) => (
                        <option key={index} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
            {error && <span className="select-error-message">{error}</span>}
        </div>
    );
};

export default Select;
