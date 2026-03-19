import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Loader from '../../components/common/Loader/Loader';
import './Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        rememberMe: false
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');

    // Load saved credentials on mount
    useEffect(() => {
        const savedEmail = localStorage.getItem('remember_email');
        const savedPassword = localStorage.getItem('remember_password');
        const savedRememberMe = localStorage.getItem('remember_me') === 'true';

        if (savedRememberMe && savedEmail) {
            setFormData(prev => ({
                ...prev,
                email: savedEmail,
                password: savedPassword || '',
                rememberMe: true
            }));
        }
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        
        // Clear field error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
        // Clear login error when user types
        if (loginError) {
            setLoginError('');
        }
    };

    const validateForm = () => {
        const newErrors = {};

        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate form
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setLoading(true);
        setLoginError('');

        try {
            const result = await login(formData.email, formData.password);

            if (result.success) {
                // Handle Remember Me
                if (formData.rememberMe) {
                    localStorage.setItem('remember_email', formData.email);
                    localStorage.setItem('remember_password', formData.password);
                    localStorage.setItem('remember_me', 'true');
                } else {
                    localStorage.removeItem('remember_email');
                    localStorage.removeItem('remember_password');
                    localStorage.removeItem('remember_me');
                }

                // Redirect based on role
                const role = result.user.role_name;

                switch(role) {
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
                setLoginError(result.error);
            }
        } catch (error) {
            setLoginError('An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="login-overlay"></div>
            </div>

            <div className="login-wrapper">
                <Card className="login-card">
                    <div className="login-header">
                        <h1 className="login-title">PrimeRetail</h1>
                        <p className="login-subtitle">Welcome back! Please login to your account</p>
                    </div>

                    {loginError && (
                        <Alert type="danger" dismissible onClose={() => setLoginError('')}>
                            {loginError}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit} className="login-form">
                        <Input
                            type="email"
                            name="email"
                            label="Email Address"
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleChange}
                            error={errors.email}
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            }
                        />

                        <Input
                            type="password"
                            name="password"
                            label="Password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            error={errors.password}
                            icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                    <path d="M19 11H5C3.9 11 3 11.9 3 13V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V13C21 11.9 20.1 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            }
                        />

                        <div className="login-options">
                            <label className="remember-me">
                                <input 
                                    type="checkbox" 
                                    name="rememberMe"
                                    checked={formData.rememberMe}
                                    onChange={handleChange}
                                /> Remember me
                            </label>
                            <a href="/forgot-password" className="forgot-password">
                                Forgot Password?
                            </a>
                        </div>

                        <Button
                            type="submit"
                            fullWidth
                            size="large"
                            disabled={loading}
                        >
                            {loading ? <Loader size="small" /> : 'Sign In'}
                        </Button>
                    </form>
                </Card>
            </div>
        </div>
    );
};

export default Login;