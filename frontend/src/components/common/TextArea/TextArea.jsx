import React from 'react';
import './TextArea.css';

const TextArea = ({ label, error, className = '', ...props }) => {
    return (
        <div className="textarea-wrapper">
            {label && <label className="textarea-label">{label}</label>}
            <textarea
                className={`textarea-field ${error ? 'textarea-error' : ''} ${className}`}
                {...props}
            />
            {error && <span className="textarea-error-message">{error}</span>}
        </div>
    );
};

export default TextArea;