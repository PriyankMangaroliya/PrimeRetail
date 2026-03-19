import React from 'react';

const FormWrapper = ({
                         children,
                         onSubmit,
                         title,
                         actions
                     }) => {
    const handleSubmit = (e) => {
        e.preventDefault();
        if (onSubmit) onSubmit();
    };

    return (
        <div className="form-wrapper">
            {title && <h2 className="form-title">{title}</h2>}
            <form onSubmit={handleSubmit}>
                <div className="form-content">
                    {children}
                </div>
                {actions && (
                    <div className="form-actions">
                        {actions}
                    </div>
                )}
            </form>
        </div>
    );
};

export default FormWrapper;