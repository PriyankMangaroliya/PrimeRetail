import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authApi from '../../api/auth.api';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Loader from '../../components/common/Loader/Loader';
import '../../styles/login.css'; // Reusing login styles for consistency

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Reset Password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [passwords, setPasswords] = useState({
        new_password: '',
        confirm_password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authApi.forgotPassword(email);
            setSuccess(response.message);
            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await authApi.verifyOTP(email, otp);
            setSuccess(response.message);
            setStep(3);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new_password !== passwords.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const response = await authApi.resetPassword({
                email,
                otp_code: otp,
                new_password: passwords.new_password,
                confirm_password: passwords.confirm_password
            });
            setSuccess(response.message + ' Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <form onSubmit={handleEmailSubmit} className="login-form-custom">
                        <div className="login-welcome">
                            <h3>Forgot Password?</h3>
                            <p>Enter your email address and we'll send you an OTP to reset your password.</p>
                        </div>
                        <Input
                            label="Email Address"
                            type="email"
                            placeholder="your-email@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-login-main" disabled={loading}>
                            {loading ? <Loader size="small" /> : 'Send OTP'}
                        </button>
                        <div className="form-extras" style={{ justifyContent: 'center', marginTop: '20px' }}>
                            <Link to="/login" className="forgot-password">Back to Login</Link>
                        </div>
                    </form>
                );
            case 2:
                return (
                    <form onSubmit={handleOtpSubmit} className="login-form-custom">
                        <div className="login-welcome">
                            <h3>Verify OTP</h3>
                            <p>An OTP has been sent to <strong>{email}</strong>. Please enter the 6-digit code below.</p>
                        </div>
                        <Input
                            label="OTP Code"
                            type="text"
                            placeholder="123456"
                            maxLength="6"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            required
                        />
                        <button type="submit" className="btn-login-main" disabled={loading}>
                            {loading ? <Loader size="small" /> : 'Verify Code'}
                        </button>
                        <div className="form-extras" style={{ justifyContent: 'center' }}>
                            <Link to="/login" className="forgot-password" onClick={() => setStep(1)}>Change Email</Link>
                        </div>
                    </form>
                );
            case 3:
                return (
                    <form onSubmit={handleResetSubmit} className="login-form-custom">
                        <div className="login-welcome">
                            <h3>Reset Password</h3>
                            <p>Please enter your new password below.</p>
                        </div>
                        <Input
                            label="New Password"
                            type="password"
                            placeholder="••••••••"
                            value={passwords.new_password}
                            onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })}
                            required
                        />
                        <Input
                            label="Confirm New Password"
                            type="password"
                            placeholder="••••••••"
                            value={passwords.confirm_password}
                            onChange={(e) => setPasswords({ ...passwords, confirm_password: e.target.value })}
                            required
                        />
                        <button type="submit" className="btn-login-main" disabled={loading}>
                            {loading ? <Loader size="small" /> : 'Reset Password'}
                        </button>
                    </form>
                );
            default:
                return null;
        }
    };

    return (
        <div className="login-container">
            <div className="login-illustration-area">
                <div className="pattern-bg"></div>
                <div className="illustration-content">
                    <h2>Secure Your Account with PrimeRetail</h2>
                </div>
                <div className="mockup-container">
                    <img src="/PrimeRetail logo.png" alt="PrimeRetail" className="mockup-image" />
                </div>
            </div>

            <div className="login-form-area">
                <div className="brand-header">
                    <div className="brand-logo">
                        <img src="/PrimeRetail logo.png" alt="Logo" />
                    </div>
                </div>

                {error && <Alert type="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert type="success" dismissible onClose={() => setSuccess('')}>{success}</Alert>}

                {renderStep()}
            </div>
        </div>
    );
};

export default ForgotPassword;
