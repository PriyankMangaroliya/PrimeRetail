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
import { useAuth } from '../../context/AuthContext';
import warehouseApi from '../../api/warehouse.api';
import Icons from '../../components/common/Icons';
import './Warehouses.css';

const Warehouses = () => {
    const { user } = useAuth();
    const [warehouses, setWarehouses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' | 'edit' | 'delete' | 'view'
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [fetchingDetails, setFetchingDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        warehouse_code: '',
        warehouse_name: '',
        location: '',
        contact_number: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [checkingCode, setCheckingCode] = useState(false);
    const [codeAvailable, setCodeAvailable] = useState(null);

    const isStoreOwner = user?.role_name === 'Store Owner';

    // ─── All hooks must be called unconditionally ─────────────────────────────
    useEffect(() => {
        if (isStoreOwner) fetchWarehouses();
        else setLoading(false);
    }, []);

    useEffect(() => {
        if (formData.warehouse_code && formData.warehouse_code.length > 0 && modalType === 'add') {
            checkWarehouseCodeAvailability();
        } else {
            setCodeAvailable(null);
        }
    }, [formData.warehouse_code, modalType]);
    // ─────────────────────────────────────────────────────────────────────────

    // Only Store Owner can access this module
    if (!isStoreOwner) {
        return (
            <MainLayout>
                <div className="warehouses-container">
                    <div className="warehouses-header">
                        <div>
                            <h1>Warehouse Management</h1>
                            <p>Access restricted for your role</p>
                        </div>
                    </div>
                    <Card className="warehouses-table-card">
                        <EmptyState
                            icon={<Icons.Lock size={48} />}
                            title="Access Restricted"
                            description="Only Store Owners can access the Warehouse Management module."
                        />
                    </Card>
                </div>
            </MainLayout>
        );
    }

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchWarehouses = async () => {
        try {
            setLoading(true);
            const response = await warehouseApi.getAllWarehouses();
            setWarehouses(response.data || []);
        } catch (err) {
            showAlert('error', err.message || 'Failed to fetch warehouses');
        } finally {
            setLoading(false);
        }
    };

    const checkWarehouseCodeAvailability = async () => {
        if (!formData.warehouse_code) return;
        setCheckingCode(true);
        try {
            const response = await warehouseApi.checkWarehouseCode(
                formData.warehouse_code,
                modalType === 'edit' ? selectedWarehouse?.id : null
            );
            setCodeAvailable(response.data.available);
        } catch (err) {
            console.error('Code check error:', err);
        } finally {
            setCheckingCode(false);
        }
    };

    // ── Alert helper ──────────────────────────────────────────────────────────
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
    };

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const resetForm = () => ({
        warehouse_code: '',
        warehouse_name: '',
        location: '',
        contact_number: ''
    });

    const handleOpenModal = async (type, warehouse = null) => {
        setModalType(type);
        setFormErrors({});
        setCodeAvailable(null);
        setShowModal(true);

        if (warehouse) {
            setFormData({
                warehouse_code: warehouse.warehouse_code || '',
                warehouse_name: warehouse.warehouse_name || '',
                location: warehouse.location || '',
                contact_number: warehouse.contact_number || ''
            });

            if (type === 'view') {
                try {
                    setFetchingDetails(true);
                    setSelectedWarehouse(warehouse); // Set initial data
                    const response = await warehouseApi.getWarehouseById(warehouse.id);
                    if (response.data) {
                        setSelectedWarehouse(response.data);
                    }
                } catch (err) {
                    console.error('Fetch warehouse details error:', err);
                    showAlert('error', 'Failed to fetch warehouse details');
                } finally {
                    setFetchingDetails(false);
                }
            } else {
                setSelectedWarehouse(warehouse);
            }
        } else {
            setSelectedWarehouse(null);
            setFormData(resetForm());
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedWarehouse(null);
        setFormData(resetForm());
        setFormErrors({});
        setCodeAvailable(null);
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = () => {
        const errors = {};

        if (modalType === 'add') {
            if (!formData.warehouse_code) {
                errors.warehouse_code = 'Warehouse code is required';
            } else if (formData.warehouse_code.length > 50) {
                errors.warehouse_code = 'Warehouse code cannot exceed 50 characters';
            } else if (codeAvailable === false) {
                errors.warehouse_code = 'Warehouse code already exists';
            }
        }

        if (!formData.warehouse_name) {
            errors.warehouse_name = 'Warehouse name is required';
        } else if (formData.warehouse_name.length > 150) {
            errors.warehouse_name = 'Warehouse name cannot exceed 150 characters';
        }

        if (!formData.contact_number) {
            errors.contact_number = 'Contact number is required';
        } else if (!/^[0-9]{10}$/.test(formData.contact_number)) {
            errors.contact_number = 'Contact number must be exactly 10 digits';
        }

        if (formData.location && formData.location.length > 500) {
            errors.location = 'Location cannot exceed 500 characters';
        }

        return errors;
    };

    // ── Submit (Add / Edit) ───────────────────────────────────────────────────
    const handleSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            if (modalType === 'add') {
                await warehouseApi.createWarehouse({
                    warehouse_code: formData.warehouse_code,
                    warehouse_name: formData.warehouse_name,
                    location: formData.location || null,
                    contact_number: formData.contact_number
                });
                showAlert('success', 'Warehouse created successfully');
            } else if (modalType === 'edit') {
                const updateData = {};
                if (formData.warehouse_name !== selectedWarehouse.warehouse_name)
                    updateData.warehouse_name = formData.warehouse_name;
                if (formData.contact_number !== selectedWarehouse.contact_number)
                    updateData.contact_number = formData.contact_number;
                if (formData.location !== (selectedWarehouse.location || ''))
                    updateData.location = formData.location || null;

                if (Object.keys(updateData).length > 0) {
                    await warehouseApi.updateWarehouse(selectedWarehouse.id, updateData);
                    showAlert('success', 'Warehouse updated successfully');
                } else {
                    showAlert('info', 'No changes were made');
                }
            }
            fetchWarehouses();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await warehouseApi.deleteWarehouse(selectedWarehouse.id);
            showAlert('success', 'Warehouse deleted successfully');
            fetchWarehouses();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete warehouse');
        }
    };

    // ── Toggle Status ─────────────────────────────────────────────────────────
    const handleToggleStatus = async (warehouse) => {
        try {
            await warehouseApi.toggleWarehouseStatus(warehouse.id);
            showAlert('success', `Warehouse ${!warehouse.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchWarehouses();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    // ── Table Columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Code',
            key: 'warehouse_code',
            render: (value) => (
                <Badge variant="primary" className="badge-code">{value}</Badge>
            )
        },
        {
            title: 'Name',
            key: 'warehouse_name',
            className: 'table-name-cell'
        },
        {
            title: 'Phone',
            key: 'contact_number',
            render: (value) => (
                <span className="table-contact-phone">{value}</span>
            )
        },
        {
            title: 'Status',
            key: 'is_active',
            render: (value) => (
                <Badge variant={value ? 'success' : 'danger'} className="badge-status">
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
                        {record.created_by_name ? `By ${record.created_by_name}` : 'By System'}
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
                        {record.updated_by_name ? `By ${record.updated_by_name}` : 'By System'}
                    </small>
                </div>
            )
        },

        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="common-action-menu" onClick={(e) => { e.stopPropagation(); }}>
                    <button
                        className="action-trigger"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === record.id ? null : record.id);
                        }}
                    >
                        <Icons.Actions size={16} />
                    </button>
                    {activeDropdown === record.id && (
                        <div className="action-dropdown">
                            <button className="action-item" onClick={() => { handleOpenModal('view', record); setActiveDropdown(null); }}>
                                <Icons.View size={16} /> View
                            </button>
                            <button className="action-item" onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                            </button>
                            <button className="action-item" onClick={() => { handleOpenModal('edit', record); setActiveDropdown(null); }}>
                                <Icons.Edit size={16} /> Edit
                            </button>
                            <button
                                onClick={() => { handleOpenModal('delete', record); setActiveDropdown(null); }}
                                disabled={Number(record.staff_count) > 0 || Number(record.stock_count) > 0}
                                className="delete-action-btn"
                            >
                                <Icons.Delete size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const staffColumns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Name',
            key: 'name',
            render: (val) => <span className="table-name-cell">{val}</span>
        },
        {
            title: 'Role',
            key: 'role',
            render: (val) => <Badge variant="info" size="small">{val}</Badge>
        }
    ];

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <MainLayout>
                <div className="warehouses-loading">
                    <Loader size="large" />
                    <p>Loading warehouses...</p>
                </div>
            </MainLayout>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div className="warehouses-container">

                {/* Header */}
                <div className="warehouses-header">
                    <div>
                        <h1>My Warehouses</h1>
                        <p>Manage your warehouses and storage locations</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => handleOpenModal('add')}>
                            <Icons.Plus size={20} /> Add New Warehouse
                        </Button>
                    </div>
                </div>

                {/* Alert */}
                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Warehouses Table */}
                <Card className="warehouses-table-card">
                    {warehouses.length > 0 ? (
                        <Table
                            columns={columns}
                            data={warehouses}
                            className="warehouses-table"
                            columnSearchable={true}
                            searchable={false}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Warehouse size={48} />}
                            title="No Warehouses Found"
                            description="You haven't created any warehouses yet. Get started by adding your first warehouse."
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    Create Warehouse
                                </Button>
                            }
                        />
                    )}
                </Card>

                {/* Warehouse Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Add New Warehouse' :
                            modalType === 'edit' ? 'Edit Warehouse' :
                                modalType === 'view' ? 'Warehouse Details' :
                                    'Delete Warehouse'
                    }
                    size={modalType === 'view' ? 'medium' : 'large'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="danger" onClick={handleDelete}>Delete Warehouse</Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="primary" onClick={handleCloseModal}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button
                                    variant="primary"
                                    onClick={handleSubmit}
                                    disabled={modalType === 'add' && codeAvailable === false}
                                >
                                    {modalType === 'add' ? 'Create Warehouse' : 'Update Warehouse'}
                                </Button>
                            </>
                        )
                    }
                >
                    {/* ── Delete Confirmation ──────────────────────────────── */}
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)" /></div>
                            <p>Are you sure you want to delete warehouse <strong>{selectedWarehouse?.warehouse_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            {(Number(selectedWarehouse?.staff_count) > 0 || Number(selectedWarehouse?.stock_count) > 0) && (
                                <p className="delete-error">
                                    Cannot delete warehouse with {selectedWarehouse.staff_count} staff member(s) or {selectedWarehouse.stock_count} stock item(s).
                                    Transfer staff and stock first.
                                </p>
                            )}
                        </div>

                        /* ── View Details ──────────────────────────────────────── */
                    ) : modalType === 'view' ? (
                        <div className="warehouse-view">
                            <div className="warehouse-details-view">
                                <div className="warehouse-brand-icon">
                                    <span className="warehouse-icon-large"><Icons.Warehouse size={40} /></span>
                                </div>
                                <div className="warehouse-info-text">
                                    <h3>{selectedWarehouse?.warehouse_name}</h3>
                                    <p><Badge variant="primary">{selectedWarehouse?.warehouse_code}</Badge></p>
                                    <p><Icons.Phone size={14} style={{ marginRight: '4px' }} /> {selectedWarehouse?.contact_number}</p>
                                </div>
                            </div>

                            <div className="view-grid" style={{ marginTop: '20px' }}>
                                <div className="view-group">
                                    <label>Location</label>
                                    <p>{selectedWarehouse?.location || 'N/A'}</p>
                                </div>
                                <div className="view-group">
                                    <label>Status</label>
                                    <p>
                                        <Badge variant={selectedWarehouse?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedWarehouse?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="view-group">
                                    <label>Inventory Summary</label>
                                    <p>Items: <Badge variant="warning">{selectedWarehouse?.total_stock_items ?? selectedWarehouse?.stock_count ?? 0}</Badge></p>
                                    {selectedWarehouse?.total_quantity != null && (
                                        <p>Quantity: <Badge variant="secondary">{selectedWarehouse.total_quantity}</Badge></p>
                                    )}
                                </div>
                                <div className="view-group">
                                    <label>Audit Details</label>
                                    <p><small>Created: {selectedWarehouse?.created_at ? new Date(selectedWarehouse.created_at).toLocaleDateString() : 'N/A'} {selectedWarehouse?.created_by_name ? `by ${selectedWarehouse.created_by_name}` : ''}</small></p>
                                    <p><small>Updated: {selectedWarehouse?.updated_at ? new Date(selectedWarehouse.updated_at).toLocaleDateString() : 'N/A'} {selectedWarehouse?.updated_by_name ? `by ${selectedWarehouse.updated_by_name}` : ''}</small></p>
                                </div>
                            </div>

                            <div className="staff-section" style={{ marginTop: '20px' }}>
                                <h4>Employee List ({selectedWarehouse?.staff?.length || selectedWarehouse?.staff_count || 0})</h4>
                                {fetchingDetails ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
                                        <Loader size="medium" />
                                    </div>
                                ) : selectedWarehouse?.staff && selectedWarehouse.staff.length > 0 ? (
                                    <div className="owner-stores-table-container" style={{ marginTop: '15px' }}>
                                        <Table
                                            columns={staffColumns}
                                            data={selectedWarehouse.staff}
                                            searchable={false}
                                            itemsPerPage={5}
                                        />
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', marginTop: '10px' }}>No staff members found for this warehouse.</p>
                                )}
                            </div>
                        </div>

                        /* ── Add / Edit Form ────────────────────────────────────── */
                    ) : (
                        <div className="warehouse-form">
                            <div className="form-row">
                                <Input
                                    label="Warehouse Code"
                                    value={formData.warehouse_code}
                                    onChange={(e) => setFormData({ ...formData, warehouse_code: e.target.value.toUpperCase() })}
                                    error={formErrors.warehouse_code}
                                    placeholder="e.g., WH001"
                                    required
                                    disabled={modalType === 'edit'}
                                    icon={
                                        modalType === 'add' ? (
                                            checkingCode ? <Icons.Reset className="spin" size={16} /> :
                                                codeAvailable === true ? <Icons.Success color="var(--success-color)" size={16} /> :
                                                    codeAvailable === false ? <Icons.Error color="var(--danger-color)" size={16} /> : null
                                        ) : null
                                    }
                                />
                                {/*{modalType === 'edit' && (*/}
                                {/*    <small className="field-note">Warehouse code cannot be changed</small>*/}
                                {/*)}*/}

                                <Input
                                    label="Warehouse Name"
                                    value={formData.warehouse_name}
                                    onChange={(e) => setFormData({ ...formData, warehouse_name: e.target.value })}
                                    error={formErrors.warehouse_name}
                                    placeholder="Enter warehouse name"
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
                            </div>

                            <Input
                                label="Location / Address"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                error={formErrors.location}
                                placeholder="Enter warehouse address or location (optional)"
                            />

                            {modalType === 'edit' && (
                                <div className="form-info">
                                    <small>• Status can be toggled using the button in the table</small>
                                    <small>• Warehouse code cannot be changed once created</small>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Warehouses;
