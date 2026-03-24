import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import { useAuth } from '../../context/AuthContext';
import Icons from '../../components/common/Icons';
import storeApi from '../../api/store.api';
import warehouseApi from '../../api/warehouse.api';
import Loader from '../../components/common/Loader/Loader';
import '../../styles/profile.css';

const Profile = () => {
    const { user } = useAuth();
    const [locationData, setLocationData] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        const fetchLocationData = async () => {
            if (!user) return;

            const needsLocationData = !['Super Admin', 'Store Owner'].includes(user.role_name);

            if (needsLocationData) {
                setLoadingLocation(true);
                try {
                    if (user.store_id) {
                        const response = await storeApi.getStoreById(user.store_id);
                        setLocationData(response.data.data || response.data);
                    } else if (user.warehouse_id) {
                        const response = await warehouseApi.getWarehouseById(user.warehouse_id);
                        setLocationData(response.data.data || response.data);
                    }
                } catch (error) {
                    console.error('Failed to fetch location data:', error);
                } finally {
                    setLoadingLocation(false);
                }
            }
        };

        fetchLocationData();
    }, [user]);

    const renderLocationInfo = () => {
        if (loadingLocation) return <Loader size="small" />;
        if (!locationData) return <p className="text-muted">No detailed location information available.</p>;

        const isStore = !!user.store_id;
        const data = locationData;

        return (
            <div className="location-details">
                <div className="info-list">
                    <div className="info-item">
                        <span className="info-label">{isStore ? 'Store' : 'Warehouse'} Name</span>
                        <span className="info-value">{isStore ? data.store_name : data.warehouse_name} ({isStore ? data.store_code : data.warehouse_code})</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Contact Number</span>
                        <span className="info-value">{data.contact_number || 'N/A'}</span>
                    </div>
                    <div className="info-item">
                        <span className="info-label">Address / Location</span>
                        <span className="info-value">
                            {isStore
                                ? `${data.address || ''}, ${data.city || ''}, ${data.state || ''} - ${data.pincode || ''}`
                                : data.location || 'N/A'
                            }
                        </span>
                    </div>
                    {isStore && data.gstin && (
                        <div className="info-item">
                            <span className="info-label">GSTIN</span>
                            <span className="info-value">{data.gstin}</span>
                        </div>
                    )}
                </div>

                <div className="owner-details-card">
                    <h4><Icons.User size={14} style={{ marginRight: '8px' }} /> Owner Details</h4>
                    <div className="info-list">
                        <div className="info-item">
                            <span className="info-label">Name</span>
                            <span className="info-value">{data.owner_name || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                            <span className="info-label">Email</span>
                            <span className="info-value">{data.owner_email || 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="profile-page">
                {/* Header Section */}
                <div className="profile-header-container">
                    <div className="profile-avatar-wrapper">
                        <div className="profile-avatar-large">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                    </div>
                    <div className="profile-header-info">
                        <h2>{user?.name}</h2>
                        <span className="profile-role-badge">{user?.role_name}</span>
                    </div>
                </div>

                <div className="profile-grid">
                    {/* Account Details Section */}
                    <div className="profile-section-card">
                        <h3 className="section-title"><Icons.User size={20} /> Account Information</h3>
                        <div className="info-list">
                            <div className="info-item">
                                <span className="info-label">Full Name</span>
                                <span className="info-value">{user?.name}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Email Address</span>
                                <span className="info-value">{user?.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Phone Number</span>
                                <span className="info-value">{user?.phone || 'Not provided'}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Member Since</span>
                                <span className="info-value">{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Assigned Location Section */}
                    {!['Super Admin', 'Store Owner'].includes(user?.role_name) && (user?.store_id || user?.warehouse_id) && (
                        <div className="profile-section-card">
                            <h3 className="section-title">
                                {user?.store_id ? <Icons.Store size={20} /> : <Icons.Warehouse size={20} />}
                                Assigned {user?.store_id ? 'Store' : 'Warehouse'}
                            </h3>
                            {renderLocationInfo()}
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Profile;
