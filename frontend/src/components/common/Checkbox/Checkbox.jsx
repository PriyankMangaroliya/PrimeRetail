import React from 'react';
import './Checkbox.css';

const Checkbox = ({ label, checked, onChange, ...props }) => {
    return (
        <label className="checkbox-container">
            <input
                type="checkbox"
                checked={checked}
                onChange={onChange}
                {...props}
            />
            <span className="checkmark"></span>
            {label && <span className="checkbox-label">{label}</span>}
        </label>
    );
};

export default Checkbox;