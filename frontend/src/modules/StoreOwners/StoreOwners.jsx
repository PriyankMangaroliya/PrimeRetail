import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import storeOwnerApi from '../../api/storeOwner.api';
import storeApi from '../../api/store.api';
import Icons from '../../components/common/Icons';
import './StoreOwners.css';

const StoreOwners = () => {
    const [owners, setOwners] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete'
    const [selectedOwner, setSelectedOwner] = useState(null);
    const [ownerStores, setOwnerStores] = useState([]);
    const [loadingStores, setLoadingStores] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirm_password: '',
        phone: '',
        profile_image: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchStoreOwners();
    }, []);

    const fetchStoreOwners = async () => {
        try {
            setLoading(true);
            const response = await storeOwnerApi.getAllStoreOwners();
            setOwners(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch store owners');
            showAlert('error', err.message || 'Failed to fetch store owners');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    };

    const fetchOwnerStores = async (ownerId) => {
        try {
            setLoadingStores(true);
            const response = await storeOwnerApi.getStoresByOwner(ownerId);
            const storesArray = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
            setOwnerStores(storesArray);
        } catch (err) {
            console.error('Failed to fetch owner stores', err);
        } finally {
            setLoadingStores(false);
        }
    };

    const handleOpenModal = (type, owner = null) => {
        setModalType(type);
        setSelectedOwner(owner);
        if (owner) {
            if (type === 'view') {
                fetchOwnerStores(owner.id);
            }
            setFormData({
                name: owner.name || '',
                email: owner.email || '',
                phone: owner.phone || '',
                profile_image: owner.profile_image || '',
                password: '',
                confirm_password: ''
            });
        } else {
            setFormData({
                name: '',
                email: '',
                password: '',
                confirm_password: '',
                phone: '',
                profile_image: ''
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedOwner(null);
        setOwnerStores([]);
        setFormData({
            name: '',
            email: '',
            password: '',
            confirm_password: '',
            phone: '',
            profile_image: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};

        // Name validation
        if (!formData.name) {
            errors.name = 'Name is required';
        } else if (formData.name.length > 100) {
            errors.name = 'Name cannot exceed 100 characters';
        }

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Email is invalid';
        } else if (formData.email.length > 100) {
            errors.email = 'Email cannot exceed 100 characters';
        }

        // Password validation for add
        if (modalType === 'add') {
            if (!formData.password) {
                errors.password = 'Password is required';
            } else if (formData.password.length < 6) {
                errors.password = 'Password must be at least 6 characters';
            } else if (formData.password.length > 255) {
                errors.password = 'Password cannot exceed 255 characters';
            }

            if (!formData.confirm_password) {
                errors.confirm_password = 'Please confirm your password';
            } else if (formData.password !== formData.confirm_password) {
                errors.confirm_password = 'Passwords do not match';
            }
        } else if (modalType === 'edit') {
            if (formData.password) {
                if (formData.password.length < 6) {
                    errors.password = 'Password must be at least 6 characters';
                } else if (formData.password.length > 255) {
                    errors.password = 'Password cannot exceed 255 characters';
                }

                if (formData.password !== formData.confirm_password) {
                    errors.confirm_password = 'Passwords do not match';
                }
            }
        }

        // Phone validation (optional) - Match backend: exactly 10 digits
        if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }

        // Profile image validation
        if (formData.profile_image && formData.profile_image.length > 255) {
            errors.profile_image = 'Profile image URL cannot exceed 255 characters';
        }

        return errors;
    };

    const handleSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (modalType === 'add') {
                const ownerData = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || null,
                    profile_image: formData.profile_image || null
                };
                await storeOwnerApi.createStoreOwner(ownerData);
                showAlert('success', 'Store owner created successfully');
            } else if (modalType === 'edit') {
                const ownerData = {};
                if (formData.name !== selectedOwner.name) ownerData.name = formData.name;
                if (formData.email !== selectedOwner.email) ownerData.email = formData.email;
                if (formData.phone !== selectedOwner.phone) ownerData.phone = formData.phone || null;
                if (formData.profile_image !== selectedOwner.profile_image) {
                    ownerData.profile_image = formData.profile_image || null;
                }
                if (formData.password) {
                    ownerData.password = formData.password;
                }

                await storeOwnerApi.updateStoreOwner(selectedOwner.id, ownerData);
                showAlert('success', 'Store owner updated successfully');
            }

            fetchStoreOwners();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await storeOwnerApi.deleteStoreOwner(selectedOwner.id);
            showAlert('success', 'Store owner deleted successfully');
            fetchStoreOwners();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete store owner');
        }
    };

    const handleToggleStatus = async (owner) => {
        try {
            await storeOwnerApi.toggleOwnerStatus(owner.id);
            showAlert('success', `Store owner ${!owner.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchStoreOwners();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };



    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="owner-no">{index + 1}</span>
        },
        {
            title: 'Owner Name',
            key: 'name',
            render: (value, record) => (
                <div className="owner-info">
                    <div className="owner-avatar">
                        {record.profile_image ? (
                            <img src={record.profile_image} alt={value} />
                        ) : (
                            <span className="owner-initials">
                                {value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                            </span>
                        )}
                    </div>
                    <div className="owner-details">
                        <strong>{value}</strong>
                        <small>{record.email}</small>
                        {record.phone && <small className="owner-phone">{record.phone}</small>}
                    </div>
                </div>
            )
        },

        {
            title: 'Stores',
            key: 'store_count',
            render: (value) => (
                <Badge variant={value > 0 ? 'primary' : 'secondary'}>
                    {value || 0} {value === 1 ? 'Store' : 'Stores'}
                </Badge>
            )
        },
        {
            title: 'Status',
            key: 'is_active',
            render: (value) => (
                <Badge variant={value ? 'success' : 'danger'}>
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            title: 'Created',
            key: 'created_at',
            render: (value, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                        {record.creator_name ? `By ${record.creator_name}` : (record.created_by ? `By User #${record.created_by}` : 'By System')}
                    </small>
                </div>
            )
        },
        {
            title: 'Updated',
            key: 'updated_at',
            render: (value, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                        {record.updater_name ? `By ${record.updater_name}` : (record.updated_by ? `By User #${record.updated_by}` : 'By System')}
                    </small>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="action-menu-container" onClick={(e) => { e.stopPropagation(); }}>
                    <button 
                        className="action-menu-trigger" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === record.id ? null : record.id);
                        }}
                    >
                        ⋮
                    </button>
                    {activeDropdown === record.id && (
                        <div className="action-menu-dropdown">
                            <button onClick={() => { handleOpenModal('view', record); setActiveDropdown(null); }}>
                                <Icons.View size={16} /> View
                            </button>
                            <button onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                            </button>
                            <button onClick={() => { handleOpenModal('edit', record); setActiveDropdown(null); }}>
                                <Icons.Edit size={16} /> Edit
                            </button>
                            <button 
                                onClick={() => { handleOpenModal('delete', record); setActiveDropdown(null); }} 
                                disabled={Number(record.store_count) > 0}
                                className="delete-action-btn"
                            >
                                <Icons.Trash size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="owners-loading">
                    <Loader size="large" />
                    <p>Loading store owners...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="owners-container">
                {/* Header */}
                <div className="owners-header">
                    <div>
                        <h1>Store Owner Management</h1>
                        <p>Manage store owners and their stores</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal('add')}
                        >
                            <Icons.Plus size={18} /> Add Store Owner
                        </Button>
                    </div>
                </div>

                {/* Alert */}
                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Owners Table */}
                <Card className="owners-table-card">
                    {owners.length > 0 ? (
                        <Table
                            columns={columns}
                            data={owners}
                            className="owners-table"
                            searchable={false}
                            columnSearchable={true}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Users size={48} />}
                            title="No Store Owners Found"
                            description="Get started by adding your first store owner"
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    <Icons.Plus size={18} /> Add Store Owner
                                </Button>
                            }
                        />
                    )}
                </Card>

                {/* Owner Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Add New Store Owner' :
                            modalType === 'edit' ? 'Edit Store Owner' :
                                modalType === 'view' ? 'View Store Owner' :
                                    'Delete Store Owner'
                    }
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Owner
                                </Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="outline" onClick={handleCloseModal}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Owner' : 'Update Owner'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete store owner <strong>{selectedOwner?.name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            {selectedOwner?.store_count > 0 && (
                                <p className="delete-error">
                                    Cannot delete owner with {selectedOwner.store_count} store(s).
                                    Transfer or delete stores first.
                                </p>
                            )}
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="owner-view">
                            <div className="owner-details-view">
                                <div className="owner-avatar-large">
                                    {selectedOwner?.profile_image ? (
                                        <img src={selectedOwner.profile_image} alt={selectedOwner.name} />
                                    ) : (
                                        <span className="owner-initials-large">
                                            {selectedOwner?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                                        </span>
                                    )}
                                </div>
                                <div className="owner-info-text">
                                    <h3>{selectedOwner?.name}</h3>
                                    <p><Icons.Mail size={16} /> {selectedOwner?.email}</p>
                                    {selectedOwner?.phone && <p><Icons.Phone size={16} /> {selectedOwner.phone}</p>}
                                </div>
                            </div>
                            <div className="owner-stores-section" style={{ marginTop: '20px' }}>
                                <h4>Stores Owned ({selectedOwner?.store_count || 0})</h4>
                                {loadingStores ? (
                                    <Loader size="small" />
                                ) : ownerStores.length > 0 ? (
                                    <div className="owner-stores-table-container" style={{ marginTop: '15px', maxHeight: '250px', overflowY: 'auto' }}>
                                        <table className="owner-stores-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #eee' }}>
                                                <tr>
                                                    <th style={{ padding: '8px', textAlign: 'left', width: '50px' }}>No</th>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ownerStores.map((store, index) => (
                                                    <tr key={store.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '8px', color: '#666' }}>{index + 1}</td>
                                                        <td style={{ padding: '8px', fontWeight: 500 }}>{store.store_name}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', marginTop: '10px' }}>No stores found for this owner.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="owner-form">
                            <div className="owner-form-grid">
                                <Input
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    error={formErrors.name}
                                    placeholder="Enter full name"
                                    required
                                />

                                <Input
                                    type="email"
                                    label="Email Address"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    error={formErrors.email}
                                    placeholder="Enter email address"
                                    required
                                />

                                <Input
                                    type="password"
                                    label="Password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    error={formErrors.password}
                                    placeholder={modalType === 'edit' ? "Leave blank to keep current" : "Enter password"}
                                    required={modalType === 'add'}
                                />

                                <Input
                                    type="password"
                                    label="Confirm Password"
                                    value={formData.confirm_password}
                                    onChange={(e) => setFormData({...formData, confirm_password: e.target.value})}
                                    error={formErrors.confirm_password}
                                    placeholder={modalType === 'edit' ? "Leave blank to keep current" : "Confirm password"}
                                    required={modalType === 'add' || formData.password}
                                />

                                <Input
                                    label="Phone Number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    error={formErrors.phone}
                                    placeholder="Enter phone number (optional)"
                                />

                                <Input
                                    label="Profile Image URL"
                                    value={formData.profile_image}
                                    onChange={(e) => setFormData({...formData, profile_image: e.target.value})}
                                    error={formErrors.profile_image}
                                    placeholder="Enter image URL (optional)"
                                />
                            </div>
                            {modalType === 'edit' && (
                                <div className="form-info" style={{ marginTop: '15px' }}>
                                    <small>• Leave password blank to keep current password</small>
                                    <small>• Status can be toggled using the button in the table</small>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default StoreOwners;