import React from 'react';

const FormField = ({
                       label,
                       name,
                       type = 'text',
                       value,
                       onChange,
                       error,
                       required = false,
                       placeholder,
                       options = []
                   }) => {
    const renderField = () => {
        switch (type) {
            case 'select':
                return (
                    <select
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="form-select"
                        required={required}
                    >
                        <option value="">Select...</option>
                        {options.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                );

            case 'textarea':
                return (
                    <textarea
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="form-textarea"
                        placeholder={placeholder}
                        required={required}
                        rows={4}
                    />
                );

            default:
                return (
                    <input
                        type={type}
                        id={name}
                        name={name}
                        value={value}
                        onChange={onChange}
                        className="form-input"
                        placeholder={placeholder}
                        required={required}
                    />
                );
        }
    };

    return (
        <div className="form-field">
            {label && (
                <label htmlFor={name} className="form-label">
                    {label}
                    {required && <span className="required-mark">*</span>}
                </label>
            )}
            {renderField()}
            {error && <span className="form-error">{error}</span>}
        </div>
    );
};

export default FormField;