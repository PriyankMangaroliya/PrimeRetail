import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/common/Button/Button';
import Icons from '../../components/common/Icons';
import './Error.css';

const NotFound = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleGoHome = () => {
        if (user) {
            // Redirect based on role
            switch(user.role_name) {
                case 'Super Admin':
                    navigate('/admin/dashboard');
                    break;
                case 'Store Owner':
                    navigate('/owner/dashboard');
                    break;
                case 'Store Manager':
                    navigate('/manager/dashboard');
                    break;
                case 'Cashier':
                    navigate('/cashier/dashboard');
                    break;
                case 'Inventory Staff':
                    navigate('/inventory/dashboard');
                    break;
                case 'Warehouse Staff':
                    navigate('/warehouse/dashboard');
                    break;
                default:
                    navigate('/dashboard');
            }
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="error-container">
            <div className="error-content">
                <div className="error-animation">
                    <div className="error-number">4</div>
                    <div className="error-zero">
                        <div className="zero-inner">0</div>
                    </div>
                    <div className="error-number">4</div>
                </div>

                <h1 className="error-title">Page Not Found</h1>

                <p className="error-message">
                    Oops! The page you're looking for doesn't exist or has been moved.
                    <br />
                    Let's get you back on track.
                </p>

                <div className="error-actions">
                    <Button
                        variant="primary"
                        size="large"
                        onClick={handleGoHome}
                    >
                        <Icons.Dashboard size={18} style={{ marginRight: '8px' }} />
                        Go to Dashboard
                    </Button>

                    <Button
                        variant="outline"
                        size="large"
                        onClick={() => navigate(-1)}
                    >
                        <Icons.CornerUpLeft size={18} style={{ marginRight: '8px' }} />
                        Go Back
                    </Button>
                </div>

                <div className="error-help">
                    <p>Need assistance? <a href="/support">Contact Support</a></p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="error-decoration">
                <div className="decoration-circle circle-1"></div>
                <div className="decoration-circle circle-2"></div>
                <div className="decoration-circle circle-3"></div>
                <div className="decoration-grid"></div>
            </div>
        </div>
    );
};

export default NotFound;