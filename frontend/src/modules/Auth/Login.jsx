import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Card from '../../components/common/Card/Card';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Loader from '../../components/common/Loader/Loader';
import '../../styles/login.css';

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

                switch (role) {
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
            {/* Left Section: Illustration */}
            <div className="login-illustration-area">
                <div className="pattern-bg"></div>
                <div className="illustration-content">
                    <h2>Advance Your Retail Operations with PrimeRetail</h2>
                </div>

                <div className="mockup-container">
                    <img
                        src="/PrimeRetail logo.png"
                        alt="PrimeRetail Illustration"
                        className="mockup-image"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://plus.unsplash.com/premium_photo-1661301051253-12502c462be1?q=80&w=2070&auto=format&fit=crop';
                        }}
                    />
                </div>
            </div>

            {/* Right Section: Form */}
            <div className="login-form-area">
                <div className="brand-header">
                    <div className="brand-logo">
                        <img src="/PrimeRetail logo.png" alt="Logo" />
                    </div>
                </div>

                <div className="login-welcome">
                    <p>Enter your email and password to access your account.</p>
                </div>

                {
                    loginError && (
                        <Alert type="danger" dismissible onClose={() => setLoginError('')} className="login-alert">
                            {loginError}
                        </Alert>
                    )
                }

                <form onSubmit={handleSubmit} className="login-form-custom">
                    <Input
                        label="Email"
                        type="email"
                        name="email"
                        placeholder="sellostore@company.com"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        required
                    />

                    <Input
                        label="Password"
                        type={formData.showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        error={errors.password}
                        required
                        suffix={
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setFormData(prev => ({ ...prev, showPassword: !prev.showPassword }))}
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    {formData.showPassword ? (
                                        <>
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </>
                                    ) : (
                                        <>
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </>
                                    )}
                                </svg>
                            </button>
                        }
                    />

                    <div className="form-extras">
                        <label className="remember-me">
                            <input
                                type="checkbox"
                                name="rememberMe"
                                checked={formData.rememberMe}
                                onChange={handleChange}
                            />
                            <span>Remember Me</span>
                        </label>
                        <a href="/forgot-password" className="forgot-password">
                            Forgot Your Password?
                        </a>
                    </div>

                    <button type="submit" className="btn-login-main" disabled={loading}>
                        {loading ? <Loader size="small" /> : 'Log In'}
                    </button>

                </form>
            </div >


        </div >
    );
};

export default Login;