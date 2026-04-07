import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import { useAuth } from '../../context/AuthContext';
import Icons from '../../components/common/Icons';
import storeApi from '../../api/store.api';
import warehouseApi from '../../api/warehouse.api';
import Loader from '../../components/common/Loader/Loader';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Alert from '../../components/common/Alert/Alert';
import Modal from '../../components/common/Modal/Modal';
import '../../styles/profile.css';

const Profile = () => {
    const { user, updateProfile, changePassword } = useAuth();
    const [locationData, setLocationData] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);

    // Modal States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    // UI States
    const [showPasswords, setShowPasswords] = useState({
        old: false,
        new: false,
        confirm: false
    });

    // Form States
    const [editForm, setEditForm] = useState({
        name: '',
        email: '',
        phone: ''
    });
    const [passwordForm, setPasswordForm] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (user) {
            setEditForm({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || ''
            });
        }
    }, [user]);

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

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await updateProfile(editForm);
            if (result.success) {
                setSuccess('Profile updated successfully');
                setIsEditModalOpen(false);
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordForm(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e) => {
        e.preventDefault();
        if (passwordForm.new_password !== passwordForm.confirm_password) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const result = await changePassword(passwordForm);
            if (result.success) {
                setSuccess('Password changed successfully');
                setIsPasswordModalOpen(false);
                setPasswordForm({ old_password: '', new_password: '', confirm_password: '' });
                setShowPasswords({ old: false, new: false, confirm: false });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const renderLocationInfo = () => {
        if (loadingLocation) return <Loader size="small" />;
        if (!locationData) return <p className="text-muted">No detailed location information available.</p>;

        const isStore = !!user.store_id;
        const data = locationData;

        return (
            <div className="location-details">
                <div className="details-row">
                    <div className="detail-item">
                        <label>{isStore ? 'Store' : 'Warehouse'} Name</label>
                        <p>{isStore ? data.store_name : data.warehouse_name}</p>
                    </div>
                    <div className="detail-item">
                        <label>Contact Number</label>
                        <p>{data.contact_number || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                        <label>Owner Name</label>
                        <p>{data.owner_name || 'N/A'}</p>
                    </div>
                    <div className="detail-item">
                        <label>Owner Email</label>
                        <p>{data.owner_email || 'N/A'}</p>
                    </div>
                    <div className="detail-item" style={{ gridColumn: 'span 4' }}>
                        <label>Address / Location</label>
                        <p>
                            {isStore
                                ? `${data.address || ''}, ${data.city || ''}, ${data.state || ''} - ${data.pincode || ''}`
                                : data.location || 'N/A'
                            }
                        </p>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <MainLayout>
            <div className="profile-page">
                {error && <Alert type="danger" dismissible onClose={() => setError('')} style={{ marginBottom: '20px' }}>{error}</Alert>}
                {success && <Alert type="success" dismissible onClose={() => setSuccess('')} style={{ marginBottom: '20px' }}>{success}</Alert>}

                {/* Part 1: Top Identity & Account Card */}
                <Card className="profile-identity-card">
                    <div className="profile-card-header">
                        <div className="profile-cover-mini"></div>
                        <div className="profile-header-content">
                            <div className="profile-avatar-wrapper">
                                <div className="profile-avatar-large">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <div className="profile-header-text">
                                <h2>{user?.name}</h2>
                                <div className="profile-meta-chips">
                                    <span className="chip chip-role">
                                        <span className="status-dot"></span>
                                        {user?.role_name}
                                    </span>
                                </div>
                            </div>
                            <div className="profile-header-actions">
                                <Button
                                    variant="primary"
                                    onClick={() => setIsEditModalOpen(true)}
                                    icon={<Icons.Edit size={16} />}
                                >
                                    Edit Profile
                                </Button>
                                <Button
                                    variant="primary"
                                    style={{ marginLeft: '10px' }}
                                    onClick={() => setIsPasswordModalOpen(true)}
                                    icon={<Icons.Key size={16} />}
                                >
                                    Reset Password
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="profile-card-details">
                        <div className="details-row">
                            <div className="detail-item">
                                <label>Full Name</label>
                                <p>{user?.name}</p>
                            </div>
                            <div className="detail-item">
                                <label>Email Address</label>
                                <p>{user?.email}</p>
                            </div>
                            <div className="detail-item">
                                <label>Phone Number</label>
                                <p>{user?.phone || <span className="text-muted italic">Not provided</span>}</p>
                            </div>
                            <div className="detail-item">
                                <label>Member Since</label>
                                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Part 2: Assigned Location & Owner Section */}
                {!['Super Admin', 'Store Owner'].includes(user?.role_name) && (user?.store_id || user?.warehouse_id) && (
                    <div className="profile-location-section">
                        <Card className="location-card-styled">
                            <div className="card-header-styled">
                                {user?.store_id ? <Icons.Store size={20} /> : <Icons.Warehouse size={20} />}
                                <h3>Assigned {user?.store_id ? 'Store' : 'Warehouse'} Details</h3>
                            </div>
                            {renderLocationInfo()}
                        </Card>
                    </div>
                )}

                {/* Edit Profile Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Personal Information"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                            <Button type="submit" form="edit-profile-form" loading={loading}>Save Changes</Button>
                        </>
                    }
                >
                    <form id="edit-profile-form" onSubmit={handleUpdateSubmit}>
                        <Input
                            label="Full Name"
                            name="name"
                            value={editForm.name}
                            onChange={handleEditChange}
                            placeholder="John Doe"
                            required
                        />
                        <Input
                            label="Email Address"
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleEditChange}
                            placeholder="john@example.com"
                            required disabled
                        />
                        <Input
                            label="Phone Number"
                            name="phone"
                            value={editForm.phone}
                            onChange={handleEditChange}
                            placeholder="+1 (555) 000-0000"
                        />
                    </form>
                </Modal>

                {/* Change/Reset Password Modal */}
                <Modal
                    isOpen={isPasswordModalOpen}
                    onClose={() => setIsPasswordModalOpen(false)}
                    title="Account Security"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
                            <Button type="submit" form="change-password-form" loading={loading} variant="primary">Reset Password</Button>
                        </>
                    }
                >
                    <form id="change-password-form" onSubmit={handlePasswordSubmit}>
                        <Alert type="warning" style={{ marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Icons.Shield size={16} />
                                <span>For your security, please do not share your password with anyone.</span>
                            </div>
                        </Alert>
                        <Input
                            label="Current Password"
                            type={showPasswords.old ? 'text' : 'password'}
                            name="old_password"
                            value={passwordForm.old_password}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            required
                            suffix={
                                <div onClick={() => togglePasswordVisibility('old')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    {showPasswords.old ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                </div>
                            }
                        />
                        <Input
                            label="New Password"
                            type={showPasswords.new ? 'text' : 'password'}
                            name="new_password"
                            value={passwordForm.new_password}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            required
                            suffix={
                                <div onClick={() => togglePasswordVisibility('new')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    {showPasswords.new ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                </div>
                            }
                        />
                        <Input
                            label="Confirm New Password"
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirm_password"
                            value={passwordForm.confirm_password}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            required
                            suffix={
                                <div onClick={() => togglePasswordVisibility('confirm')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    {showPasswords.confirm ? <Icons.EyeOff size={18} /> : <Icons.Eye size={18} />}
                                </div>
                            }
                        />
                    </form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Profile;
