import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import { useAuth } from '../../context/AuthContext';
import Icons from '../../components/common/Icons';
import './Profile.css';

const Profile = () => {
    const { user } = useAuth();

    return (
        <MainLayout>
            <div className="profile-page">
                <div className="profile-header-background"></div>
                <Card className="profile-card">
                    <div className="profile-header">
                        <div className="profile-avatar-large">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        <h2>{user?.name}</h2>
                        <p className="profile-role">{user?.role_name}</p>
                    </div>

                    <div className="profile-details">
                        <div className="detail-item">
                            <label><Icons.Mail size={16} /> Email</label>
                            <p>{user?.email}</p>
                        </div>
                        <div className="detail-item">
                            <label><Icons.Phone size={16} /> Phone</label>
                            <p>{user?.phone || 'Not provided'}</p>
                        </div>
                        
                        {user?.store_id && (
                            <div className="detail-item">
                                <label><Icons.Store size={16} /> Assigned Store</label>
                                <p>{user?.store_name || `Store #${user?.store_id}`} {user?.store_code && `(${user?.store_code})`}</p>
                            </div>
                        )}

                        {user?.warehouse_id && (
                            <div className="detail-item">
                                <label><Icons.Warehouse size={16} /> Assigned Warehouse</label>
                                <p>{user?.warehouse_name || `Warehouse #${user?.warehouse_id}`} {user?.warehouse_code && `(${user?.warehouse_code})`}</p>
                            </div>
                        )}

                        <div className="detail-item">
                            <label><Icons.Calendar size={16} /> Member Since</label>
                            <p>{new Date(user?.created_at).toLocaleDateString()}</p>
                        </div>
                        
                        {/* If no store or warehouse assigned, show a generic placeholder for specific roles or just keep it clean */}
                        {!user?.store_id && !user?.warehouse_id && user?.role_name !== 'Super Admin' && user?.role_name !== 'Store Owner' && (
                            <div className="detail-item detail-item-empty">
                                <label><Icons.Building size={16} /> Work Location</label>
                                <p className="text-muted">Not assigned to any location</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Profile;