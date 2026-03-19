import React, { useState, useEffect } from 'react';
import Icons from '../Icons';
import './Alert.css';

const Alert = ({
    children,
    type = 'info',
    dismissible = false,
    onClose,
    duration = 10000
}) => {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        if (duration) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsVisible(false);
        if (onClose) onClose();
    };

    if (!isVisible) return null;

    return (
        <div className={`alert alert-${type}`}>
            <div className="alert-content">
                {children}
            </div>
            {dismissible && (
                <button className="alert-close" onClick={handleClose}>
                    <Icons.X size={16} />
                </button>
            )}
        </div>
    );
};

export default Alert;