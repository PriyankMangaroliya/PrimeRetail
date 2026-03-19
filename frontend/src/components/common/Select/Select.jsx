import React from 'react';
import './Select.css';

const Select = ({ label, options = [], error, className = '', ...props }) => {
    return (
        <div className="select-wrapper">
            {label && <label className="select-label">{label}</label>}
            <select
                className={`select-field ${error ? 'select-error' : ''} ${className}`}
                {...props}
            >
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            {error && <span className="select-error-message">{error}</span>}
        </div>
    );
};

export default Select;