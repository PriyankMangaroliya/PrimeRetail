import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TextArea from '../../components/common/TextArea/TextArea';
import Alert from '../../components/common/Alert/Alert';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAuth } from '../../context/AuthContext';
import storeApi from '../../api/store.api';
import Icons from '../../components/common/Icons';
import './Stores.css';

const Stores = () => {
    const { user } = useAuth();
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete', 'view'
    const [selectedStore, setSelectedStore] = useState(null);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        store_code: '',
        store_name: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        contact_number: '',
        gstin: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeAvailable, setCodeAvailable] = useState(null);

    const isStoreOwner = user?.role_name === 'Store Owner';
    const isStoreManager = user?.role_name === 'Store Manager';
    const isSuperAdmin = user?.role_name === 'Super Admin';

    useEffect(() => {
        if (!isSuperAdmin) fetchStores();
    }, []);

    useEffect(() => {
        if (formData.store_code && formData.store_code.length > 0 && modalType === 'add') {
            checkStoreCodeAvailability();
        } else {
            setCodeAvailable(null);
        }
    }, [formData.store_code, modalType]);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const response = await storeApi.getAllStores();
            setStores(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch stores');
            showAlert('error', err.message || 'Failed to fetch stores');
        } finally {
            setLoading(false);
        }
    };

    const checkStoreCodeAvailability = async () => {
        if (!formData.store_code) return;

        setCheckingCode(true);
        try {
            const response = await storeApi.checkStoreCode(
                formData.store_code,
                modalType === 'edit' ? selectedStore?.id : null
            );
            setCodeAvailable(response.data.available);
        } catch (err) {
            console.error('Code check error:', err);
        } finally {
            setCheckingCode(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    };

    const handleOpenModal = async (type, store = null) => {
        setModalType(type);
        setFormErrors({});
        setCodeAvailable(null);
        setShowModal(true);

        if (store) {
            setFormData({
                store_code: store.store_code || '',
                store_name: store.store_name || '',
                address: store.address || '',
                city: store.city || '',
                state: store.state || '',
                pincode: store.pincode || '',
                contact_number: store.contact_number || '',
                gstin: store.gstin || ''
            });

            if (type === 'view') {
                try {
                    setFetchingDetails(true);
                    setSelectedStore(store); // Set initial data from list
                    const response = await storeApi.getStoreById(store.id);
                    if (response.data) {
                        setSelectedStore(response.data);
                    }
                } catch (err) {
                    console.error('Fetch store details error:', err);
                    showAlert('error', 'Failed to fetch store details');
                } finally {
                    setFetchingDetails(false);
                }
            } else {
                setSelectedStore(store);
            }
        } else {
            setSelectedStore(null);
            setFormData({
                store_code: '',
                store_name: '',
                address: '',
                city: '',
                state: '',
                pincode: '',
                contact_number: '',
                gstin: ''
            });
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedStore(null);
        setFormData({
            store_code: '',
            store_name: '',
            address: '',
            city: '',
            state: '',
            pincode: '',
            contact_number: '',
            gstin: ''
        });
        setFormErrors({});
        setCodeAvailable(null);
    };

    const validateForm = () => {
        const errors = {};

        // Store code validation - only for add modal
        if (modalType === 'add') {
            if (!formData.store_code) {
                errors.store_code = 'Store code is required';
            } else if (formData.store_code.length > 50) {
                errors.store_code = 'Store code cannot exceed 50 characters';
            } else if (codeAvailable === false) {
                errors.store_code = 'Store code already exists';
            }
        }

        // Store name validation
        if (!formData.store_name) {
            errors.store_name = 'Store name is required';
        } else if (formData.store_name.length > 150) {
            errors.store_name = 'Store name cannot exceed 150 characters';
        }

        // Contact number validation - Match backend: exactly 10 digits
        if (!formData.contact_number) {
            errors.contact_number = 'Contact number is required';
        } else if (!/^[0-9]{10}$/.test(formData.contact_number)) {
            errors.contact_number = 'Contact number must be exactly 10 digits';
        }

        // Pincode validation (optional)
        if (formData.pincode && !/^[0-9]{6}$/.test(formData.pincode)) {
            errors.pincode = 'Pincode must be 6 digits';
        }

        // GSTIN validation (optional)
        if (formData.gstin && formData.gstin.length > 20) {
            errors.gstin = 'GSTIN cannot exceed 20 characters';
        }

        // Address validation (optional)
        if (formData.address && formData.address.length > 500) {
            errors.address = 'Address cannot exceed 500 characters';
        }

        // City validation (optional)
        if (formData.city && formData.city.length > 100) {
            errors.city = 'City cannot exceed 100 characters';
        }

        // State validation (optional)
        if (formData.state && formData.state.length > 100) {
            errors.state = 'State cannot exceed 100 characters';
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
            const storeData = {
                store_name: formData.store_name,
                contact_number: formData.contact_number,
                address: formData.address || null,
                city: formData.city || null,
                state: formData.state || null,
                pincode: formData.pincode || null,
                gstin: formData.gstin || null
            };

            if (modalType === 'add') {
                // Include store_code only for add
                storeData.store_code = formData.store_code;
                await storeApi.createStore(storeData);
                showAlert('success', 'Store created successfully');
            } else if (modalType === 'edit') {
                const updateData = {};
                if (formData.store_name !== selectedStore.store_name) updateData.store_name = formData.store_name;
                if (formData.contact_number !== selectedStore.contact_number) updateData.contact_number = formData.contact_number;
                if (formData.address !== selectedStore.address) updateData.address = formData.address || null;
                if (formData.city !== selectedStore.city) updateData.city = formData.city || null;
                if (formData.state !== selectedStore.state) updateData.state = formData.state || null;
                if (formData.pincode !== selectedStore.pincode) updateData.pincode = formData.pincode || null;
                if (formData.gstin !== selectedStore.gstin) updateData.gstin = formData.gstin || null;

                // Only send if there are changes
                if (Object.keys(updateData).length > 0) {
                    await storeApi.updateStore(selectedStore.id, updateData);
                    showAlert('success', 'Store updated successfully');
                } else {
                    showAlert('info', 'No changes were made');
                }
            }

            fetchStores();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await storeApi.deleteStore(selectedStore.id);
            showAlert('success', 'Store deleted successfully');
            fetchStores();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete store');
        }
    };

    const handleToggleStatus = async (store) => {
        try {
            await storeApi.toggleStoreStatus(store.id);
            showAlert('success', `Store ${!store.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchStores();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    // Columns configuration based on user role
    const getColumns = () => {
        const baseColumns = [
            {
                title: 'No',
                key: 'index',
                render: (_, __, index) => <span className="store-no">{index + 1}</span>
            },
            {
                title: 'Code',
                key: 'store_code',
                render: (value) => <Badge variant="primary" className="store-code-badge">{value}</Badge>
            },
            {
                title: 'Name',
                key: 'store_name',
                className: 'store-name-col'
            },
            {
                title: 'Phone',
                key: 'contact_number',
                className: 'contact-phone-col',
                render: (value, record) => (
                    <div className="contact-info">
                        <div className="contact-phone">{value}</div>
                    </div>
                )
            },
            {
                title: 'Status',
                key: 'is_active',
                render: (value) => (
                    <Badge variant={value ? 'success' : 'danger'} className="status-badge">
                        {value ? 'Active' : 'Inactive'}
                    </Badge>
                )
            }
        ];

        if (isStoreOwner) {
            // Store Owner: full action buttons

            baseColumns.push({
                title: 'Created',
                key: 'created_at',
                render: (value, record) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{new Date(value).toLocaleDateString()}</span>
                        <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                            {record.created_by_name ? `By ${record.created_by_name}` : 'By System'}
                        </small>
                    </div>
                )
            });

            baseColumns.push({
                title: 'Updated',
                key: 'updated_at',
                render: (value, record) => (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{new Date(value).toLocaleDateString()}</span>
                        <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                            {record.updated_by_name ? `By ${record.updated_by_name}` : 'By System'}
                        </small>
                    </div>
                )
            });

            baseColumns.push({
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
                            <Icons.Actions size={16} />
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
                                    disabled={Number(record.employee_count) > 0}
                                    className="delete-action-btn"
                                >
                                    <Icons.Delete size={16} /> Delete
                                </button>
                            </div>
                        )}
                    </div>
                )
            });
        } else if (isStoreManager) {
            // Store Manager: view-only, no management actions
            baseColumns.push({
                title: 'View',
                key: 'view',
                render: (_, record) => (
                    <Button
                        size="small"
                        variant="outline"
                        onClick={() => handleOpenModal('view', record)}
                        title="View Details"
                    >
                        <Icons.View size={16} /> View
                    </Button>
                )
            });
        }

        return baseColumns;
    };

    // Super Admin has no access to the Stores module — show restricted page
    if (isSuperAdmin) {
        return (
            <MainLayout>
                <div className="stores-container">
                    <div className="stores-header">
                        <div>
                            <h1>Store Management</h1>
                            <p>Access restricted for your role</p>
                        </div>
                    </div>
                    <Card className="stores-table-card">
                        <EmptyState
                            icon={<Icons.Lock size={48} />}
                            title="Access Restricted"
                            description="Super Admin does not have access to the Store Management module. Store Owners manage their own stores."
                        />
                    </Card>
                </div>
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="stores-loading">
                    <Loader size="large" />
                    <p>Loading stores...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="stores-container">
                {/* Header */}
                <div className="stores-header">
                    <div>
                        <h1>{isStoreOwner ? 'My Stores' : 'My Store'}</h1>
                        <p>
                            {isStoreOwner ? 'Manage your stores and configurations' :
                                'View your assigned store details'}
                        </p>
                    </div>
                    {isStoreOwner && (
                        <div className="header-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleOpenModal('add')}
                            >
                                <Icons.Plus size={20} /> Add New Store
                            </Button>
                        </div>
                    )}
                </div>

                {/* Alert */}
                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Stores Table */}
                <Card className="stores-table-card">
                    {stores.length > 0 ? (
                        <Table
                            columns={getColumns()}
                            data={stores}
                            className="stores-table"
                            columnSearchable={true}
                            searchable={false}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Store size={48} />}
                            title="No Stores Found"
                            description={
                                isStoreOwner ?
                                    "You haven't created any stores yet. Get started by adding your first store." :
                                    "No store is assigned to you yet. Please contact your administrator."
                            }
                            action={
                                isStoreOwner && (
                                    <Button onClick={() => handleOpenModal('add')}>
                                        Create Store
                                    </Button>
                                )
                            }
                        />
                    )}
                </Card>

                {/* Store Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Add New Store' :
                            modalType === 'edit' ? 'Edit Store' :
                                modalType === 'view' ? 'Store Details' :
                                    'Delete Store'
                    }
                    size={modalType === 'view' ? 'medium' : 'large'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Store
                                </Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="primary" onClick={handleCloseModal}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={modalType === 'add' && codeAvailable === false}
                                >
                                    {modalType === 'add' ? 'Create Store' : 'Update Store'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)" /></div>
                            <p>Are you sure you want to delete store <strong>{selectedStore?.store_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            {selectedStore?.employee_count > 0 && (
                                <p className="delete-error">
                                    Cannot delete store with {selectedStore.employee_count} employee(s).
                                    Transfer employees first.
                                </p>
                            )}
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="store-view">
                            <div className="store-details-view">
                                <div className="store-brand-icon">
                                    <span className="store-icon-large"><Icons.Store size={40} /></span>
                                </div>
                                <div className="store-info-text">
                                    <h3>{selectedStore?.store_name}</h3>
                                    <p><Badge variant="primary">{selectedStore?.store_code}</Badge></p>
                                    <p><Icons.Phone size={14} style={{ marginRight: '4px' }} /> {selectedStore?.contact_number}</p>
                                    {selectedStore?.gstin && <p><Icons.Invoice size={14} style={{ marginRight: '4px' }} /> GST: {selectedStore.gstin}</p>}
                                </div>
                            </div>

                            <div className="view-grid" style={{ marginTop: '20px' }}>
                                <div className="view-group">
                                    <label>Location</label>
                                    <p>{selectedStore?.address || 'N/A'}</p>
                                    <p>{[selectedStore?.city, selectedStore?.state, selectedStore?.pincode].filter(Boolean).join(', ')}</p>
                                </div>
                                <div className="view-group">
                                    <label>Status</label>
                                    <p>
                                        <Badge variant={selectedStore?.is_active ? 'success' : 'danger'}>
                                            {selectedStore?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="view-group">
                                    <label>Created</label>
                                    <p>{selectedStore?.created_at ? new Date(selectedStore.created_at).toLocaleString() : 'N/A'}</p>
                                    <small style={{ color: 'var(--gray-600)' }}>{selectedStore?.created_by_name ? `By ${selectedStore.created_by_name}` : ''}</small>
                                </div>
                                <div className="view-group">
                                    <label>Last Updated</label>
                                    <p>{selectedStore?.updated_at ? new Date(selectedStore.updated_at).toLocaleString() : 'N/A'}</p>
                                    <small style={{ color: 'var(--gray-600)' }}>{selectedStore?.updated_by_name ? `By ${selectedStore.updated_by_name}` : ''}</small>
                                </div>
                            </div>

                            <div className="store-employees-section" style={{ marginTop: '20px' }}>
                                <h4>Employees ({selectedStore?.employees?.length || selectedStore?.employee_count || 0})</h4>
                                {fetchingDetails ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                        <Loader size="medium" />
                                    </div>
                                ) : selectedStore?.employees && selectedStore.employees.length > 0 ? (
                                    <div className="owner-stores-table-container" style={{ marginTop: '15px', maxHeight: '250px', overflowY: 'auto' }}>
                                        <table className="owner-stores-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead style={{ position: 'sticky', top: 0, background: 'white', borderBottom: '2px solid #eee' }}>
                                                <tr>
                                                    <th style={{ padding: '8px', textAlign: 'left', width: '50px' }}>No</th>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Name</th>
                                                    <th style={{ padding: '8px', textAlign: 'left' }}>Role</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedStore.employees.map((emp, index) => (
                                                    <tr key={emp.id} style={{ borderBottom: '1px solid #eee' }}>
                                                        <td style={{ padding: '8px', color: '#666' }}>{index + 1}</td>
                                                        <td style={{ padding: '8px', fontWeight: 500 }}>{emp.name}</td>
                                                        <td style={{ padding: '8px' }}>
                                                            <Badge variant="info" size="small">{emp.role}</Badge>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', marginTop: '10px' }}>No employees found for this store.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="store-form">
                            <div className="form-row">
                                <Input
                                    label="Store Code"
                                    value={formData.store_code}
                                    onChange={(e) => setFormData({ ...formData, store_code: e.target.value.toUpperCase() })}
                                    error={formErrors.store_code}
                                    placeholder="e.g., STORE001"
                                    required
                                    disabled={modalType === 'edit'} // Store code cannot be edited
                                    icon={
                                        modalType === 'add' ? (
                                            checkingCode ? <Icons.Reset className="spin" size={16} /> :
                                                codeAvailable === true ? <Icons.Success color="var(--success-color)" size={16} /> :
                                                    codeAvailable === false ? <Icons.Error color="var(--danger-color)" size={16} /> : null
                                        ) : null
                                    }
                                />
                                <Input
                                    label="Store Name"
                                    value={formData.store_name}
                                    onChange={(e) => setFormData({ ...formData, store_name: e.target.value })}
                                    error={formErrors.store_name}
                                    placeholder="Enter store name"
                                    required
                                />
                            </div>

                            <div className="form-row">
                                <Input
                                    label="Contact Number"
                                    value={formData.contact_number}
                                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                                    error={formErrors.contact_number}
                                    placeholder="10 digits"
                                    required
                                />

                                <Input
                                    label="GSTIN"
                                    value={formData.gstin}
                                    onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                                    error={formErrors.gstin}
                                    placeholder="Enter GSTIN (optional)"
                                />
                            </div>

                            <TextArea
                                label="Address"
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                error={formErrors.address}
                                placeholder="Enter complete address (optional)"
                                rows={2}
                            />

                            <div className="form-row">
                                <Input
                                    label="City"
                                    value={formData.city}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                    error={formErrors.city}
                                    placeholder="Enter city (optional)"
                                />

                                <Input
                                    label="State"
                                    value={formData.state}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    error={formErrors.state}
                                    placeholder="Enter state (optional)"
                                />

                                <Input
                                    label="Pincode"
                                    value={formData.pincode}
                                    onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                                    error={formErrors.pincode}
                                    placeholder="6 digits (optional)"
                                />
                            </div>

                            {modalType === 'edit' && (
                                <div className="form-info">
                                    <small>• Status can be toggled using the button in the table</small>
                                    <small>• Store code cannot be changed once created</small>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Stores;