import React from 'react';
import './Radio.css';

const Radio = ({ label, checked, onChange, name, ...props }) => {
    return (
        <label className="radio-container">
            <input
                type="radio"
                name={name}
                checked={checked}
                onChange={onChange}
                {...props}
            />
            <span className="radio-mark"></span>
            {label && <span className="radio-label">{label}</span>}
        </label>
    );
};

export default Radio;