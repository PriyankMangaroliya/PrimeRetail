import React, { createContext, useState, useContext, useEffect } from 'react';
import authApi from '../api/auth.api';
import Loader from '../components/common/Loader/Loader';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            try {
                const response = await authApi.getProfile();
                setUser(response.data);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authApi.login(email, password);

            const { accessToken, refreshToken, user } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);

            setUser(user);

            return { success: true, user };
        } catch (error) {
            setError(error.message || 'Login failed');
            return { success: false, error: error.message || 'Login failed' };
        }
    };

    const logout = async () => {
        try {
            await authApi.logout();
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            setUser(null);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setError(null);
            const response = await authApi.updateProfile(profileData);
            setUser(response.data);
            return { success: true, user: response.data };
        } catch (error) {
            setError(error.message || 'Profile update failed');
            return { success: false, error: error.message || 'Profile update failed' };
        }
    };

    const changePassword = async (passwordData) => {
        try {
            setError(null);
            await authApi.changePassword(passwordData);
            return { success: true };
        } catch (error) {
            setError(error.message || 'Password change failed');
            return { success: false, error: error.message || 'Password change failed' };
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        updateProfile,
        changePassword,
        isAuthenticated: !!user,
    };

    if (loading) {
        return <Loader fullScreen />;
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};