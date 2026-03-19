import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Icons from '../../common/Icons';
import './Navbar.css';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleProfile = () => {
        setIsDropdownOpen(false);
        navigate('/profile');
    };

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="navbar">
            <div className="navbar-left">
                {/* Empty or can add breadcrumbs here if needed */}
            </div>

            <div className="navbar-right">
                <div className="notification-icon">
                    <span className="badge">3</span>
                    <Icons.Bell size={20} />
                </div>

                <div className="profile-container" ref={dropdownRef}>
                    <div
                        className="profile-trigger"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    >
                        <div className="profile-picture">
                            {user?.profile_image ? (
                                <img src={user.profile_image} alt={user.name} />
                            ) : (
                                <span className="profile-initials">{getUserInitials()}</span>
                            )}
                        </div>
                        <Icons.ChevronDown
                            size={12}
                            className={`dropdown-arrow ${isDropdownOpen ? 'open' : ''}`}
                        />
                    </div>

                    {isDropdownOpen && (
                        <div className="dropdown-menu">
                            <div className="dropdown-header">
                                <div className="dropdown-user-info">
                                    <span className="dropdown-user-name">{user?.name || 'User'}</span>
                                    <span className="dropdown-user-role">{user?.role_name || 'User'}</span>
                                </div>
                            </div>
                            <div className="dropdown-divider"></div>
                            <div className="dropdown-item" onClick={handleProfile}>
                                <span className="dropdown-icon"><Icons.User size={16} /></span>
                                <span>Profile</span>
                            </div>
                            <div className="dropdown-item" onClick={handleLogout}>
                                <span className="dropdown-icon"><Icons.LogOut size={16} /></span>
                                <span>Logout</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Navbar;