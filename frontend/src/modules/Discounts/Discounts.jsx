import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import Select from '../../components/common/Select/Select';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAuth } from '../../context/AuthContext';
import discountApi from '../../api/discount.api';
import Icons from '../../components/common/Icons';


const Discounts = () => {
    const { user } = useAuth();
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' | 'edit' | 'delete' | 'view'
    const [selectedDiscount, setSelectedDiscount] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const [formData, setFormData] = useState({
        discount_name: '',
        discount_type: 'Percentage',
        discount_value: '',
        description: '',
        start_date: '',
        end_date: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const isStoreOwner = user?.role_name === 'Store Owner';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isStoreOwner) fetchDiscounts();
        else setLoading(false);
    }, [isStoreOwner]);

    // Only Store Owner can access this module
    if (!isStoreOwner) {
        return (
            <MainLayout>
                <div className="discounts-container">
                    <div className="page-header">
                        <div>
                            <h1>Discount Management</h1>
                            <p>Access restricted for your role</p>
                        </div>
                    </div>
                    <Card className="discounts-table-card">
                        <EmptyState
                            icon={<Icons.Lock size={48} />}
                            title="Access Restricted"
                            description="Only Store Owners can access the Discount Management module."
                        />
                    </Card>
                </div>
            </MainLayout>
        );
    }

    // ── Data fetching ─────────────────────────────────────────────────────────
    const fetchDiscounts = async () => {
        try {
            setLoading(true);
            const response = await discountApi.getAllDiscounts();
            setDiscounts(response.data || []);
        } catch (err) {
            showAlert('error', err.message || 'Failed to fetch discounts');
        } finally {
            setLoading(false);
        }
    };

    // ── Alert helper ──────────────────────────────────────────────────────────
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
    };

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const resetForm = () => ({
        discount_name: '',
        discount_type: 'Percentage',
        discount_value: '',
        description: '',
        start_date: '',
        end_date: ''
    });

    const handleOpenModal = (type, discount = null) => {
        setModalType(type);
        setSelectedDiscount(discount);
        setFormData(discount ? {
            discount_name: discount.discount_name || '',
            discount_type: discount.discount_type || 'Percentage',
            discount_value: discount.discount_value || '',
            description: discount.description || '',
            start_date: discount.start_date ? new Date(discount.start_date).toISOString().split('T')[0] : '',
            end_date: discount.end_date ? new Date(discount.end_date).toISOString().split('T')[0] : ''
        } : resetForm());
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedDiscount(null);
        setFormData(resetForm());
        setFormErrors({});
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = () => {
        const errors = {};

        if (!formData.discount_name?.trim()) {
            errors.discount_name = 'Discount name is required';
        } else if (formData.discount_name.length > 100) {
            errors.discount_name = 'Discount name cannot exceed 100 characters';
        }

        if (!formData.discount_type) {
            errors.discount_type = 'Discount type is required';
        }

        if (!formData.discount_value && formData.discount_value !== 0) {
            errors.discount_value = 'Discount value is required';
        } else {
            const val = parseFloat(formData.discount_value);
            if (isNaN(val) || val <= 0) {
                errors.discount_value = 'Discount value must be a positive number';
            } else if (formData.discount_type === 'Percentage' && val > 100) {
                errors.discount_value = 'Percentage cannot exceed 100';
            }
        }

        if (!formData.start_date) {
            errors.start_date = 'Start date is required';
        }

        if (!formData.end_date) {
            errors.end_date = 'End date is required';
        } else if (formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
            errors.end_date = 'End date must be after start date';
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
            const payload = {
                discount_name: formData.discount_name.trim(),
                discount_type: formData.discount_type,
                discount_value: parseFloat(formData.discount_value),
                description: formData.description?.trim() || null,
                start_date: formData.start_date,
                end_date: formData.end_date
            };

            if (modalType === 'add') {
                await discountApi.createDiscount(payload);
                showAlert('success', 'Discount created successfully');
            } else if (modalType === 'edit') {
                await discountApi.updateDiscount(selectedDiscount.id, payload);
                showAlert('success', 'Discount updated successfully');
            }
            fetchDiscounts();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Operation failed');
        }
    };

    // ── Delete ────────────────────────────────────────────────────────────────
    const handleDelete = async () => {
        try {
            await discountApi.deleteDiscount(selectedDiscount.id);
            showAlert('success', 'Discount deleted successfully');
            fetchDiscounts();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete discount');
        }
    };

    // ── Toggle Status ─────────────────────────────────────────────────────────
    const handleToggleStatus = async (discount) => {
        try {
            await discountApi.toggleDiscountStatus(discount.id);
            showAlert('success', `Discount ${!discount.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchDiscounts();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    // ── Table Columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'No',
            key: 'id',
            render: (_, __, index) => (
                <span className="table-no-cell">{index + 1}</span>
            )
        },
        {
            title: 'Name',
            key: 'discount_name',
            className: 'table-name-cell'
        },
        {
            title: 'Type',
            key: 'discount_type',
            render: (value) => (
                <Badge variant={value === 'Percentage' ? 'primary' : 'secondary'} className="badge-status">
                    {value === 'Percentage' ? <Icons.Percent size={14} style={{ marginRight: '4px' }} /> : `₹ `}
                    {value}
                </Badge>
            )
        },
        {
            title: 'Value',
            key: 'discount_value',
            render: (value, record) => (
                <span className="table-value">
                    {record.discount_type === 'Percentage'
                        ? `${parseFloat(value).toFixed(2)}%`
                        : `₹${parseFloat(value).toFixed(2)}`}
                </span>
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
            title: 'Start Date',
            key: 'start_date',
            render: (value) => (
                <span className="table-date">{value ? new Date(value).toLocaleDateString() : 'N/A'}</span>
            )
        },
        {
            title: 'End Date',
            key: 'end_date',
            render: (value) => (
                <span className="table-date">{value ? new Date(value).toLocaleDateString() : 'N/A'}</span>
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
                                className="action-item delete-item"
                            >
                                <Icons.Delete size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    // ── Loading ───────────────────────────────────────────────────────────────
    if (loading) {
        return (
            <MainLayout>
                <div className="page-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <MainLayout>
            <div className="discounts-container">

                {/* Header */}
                <div className="page-header">
                    <div>
                        <h1>Discount Management</h1>
                        <p>
                            {isStoreOwner
                                ? 'Manage your store discounts'
                                : 'View available discounts'}
                        </p>
                    </div>
                    {isStoreOwner && (
                        <div className="header-actions">
                            <Button variant="primary" onClick={() => handleOpenModal('add')}>
                                <Icons.Plus size={18} /> Add New Discount
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

                {/* Discounts Table */}
                <Card className="discounts-table-card">
                    {discounts.length > 0 ? (
                        <Table
                            columns={columns}
                            data={discounts}
                            className="common-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Discounts"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Tag size={48} />}
                            title="No Discounts Found"
                            description={
                                isStoreOwner
                                    ? "You haven't created any discounts yet. Get started by adding your first discount."
                                    : "No discounts available for your store."
                            }
                            action={
                                isStoreOwner ? (
                                    <Button onClick={() => handleOpenModal('add')}>
                                        <Icons.Plus size={18} /> Create Discount
                                    </Button>
                                ) : null
                            }
                        />
                    )}
                </Card>

                {/* Discount Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Add New Discount' :
                            modalType === 'edit' ? 'Edit Discount' :
                                modalType === 'view' ? 'Discount Details' :
                                    'Delete Discount'
                    }
                    size={modalType === 'view' ? 'medium' : 'large'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="danger" onClick={handleDelete}>Delete Discount</Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="outline" onClick={handleCloseModal}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Discount' : 'Update Discount'}
                                </Button>
                            </>
                        )
                    }
                >
                    {/* ── Delete Confirmation ──────────────────────────────── */}
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete discount <strong>{selectedDiscount?.discount_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>

                        /* ── View Details ──────────────────────────────────────── */
                    ) : modalType === 'view' ? (
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    <Icons.Tag size={32} />
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedDiscount?.discount_name}</h2>
                                    <div className="detail-meta">
                                        <Badge variant={selectedDiscount?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedDiscount?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant={selectedDiscount?.discount_type === 'Percentage' ? 'primary' : 'secondary'} className="badge-code">
                                            {selectedDiscount?.discount_type}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-header">Discount Information</h4>
                                <div className="view-grid">
                                    <div className="view-group">
                                        <label>Discount Type</label>
                                        <p>{selectedDiscount?.discount_type}</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Discount Value</label>
                                        <p className="price-tag">
                                            {selectedDiscount?.discount_type === 'Percentage'
                                                ? `${parseFloat(selectedDiscount?.discount_value || 0).toFixed(2)}%`
                                                : `₹${parseFloat(selectedDiscount?.discount_value || 0).toFixed(2)}`}
                                        </p>
                                    </div>
                                    <div className="view-group">
                                        <label>Status</label>
                                        <p>{selectedDiscount?.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Start Date</label>
                                        <p>{selectedDiscount?.start_date ? new Date(selectedDiscount.start_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="view-group">
                                        <label>End Date</label>
                                        <p>{selectedDiscount?.end_date ? new Date(selectedDiscount.end_date).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                    <div className="view-group full-width">
                                        <label>Description</label>
                                        <p>{selectedDiscount?.description || 'No description provided.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        /* ── Add / Edit Form ────────────────────────────────────── */
                    ) : (
                        <div className="common-form">
                            <div className="common-form-grid">
                                <div className="full-width">
                                    <Input
                                        label="Discount Name"
                                        value={formData.discount_name}
                                        onChange={(e) => setFormData({ ...formData, discount_name: e.target.value })}
                                        error={formErrors.discount_name}
                                        placeholder="e.g., Summer Sale"
                                        required
                                    />
                                </div>

                                <Input
                                    label="Start Date"
                                    type="date"
                                    value={formData.start_date}
                                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    error={formErrors.start_date}
                                    required
                                />
                                <Input
                                    label="End Date"
                                    type="date"
                                    value={formData.end_date}
                                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    error={formErrors.end_date}
                                    required
                                />

                                <Select
                                    label="Discount Type"
                                    required
                                    value={formData.discount_type}
                                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                                    error={formErrors.discount_type}
                                    options={[
                                        { value: 'Percentage', label: 'Percentage (%)' },
                                        { value: 'Fixed', label: 'Fixed Amount (₹)' }
                                    ]}
                                />

                                <Input
                                    label={`Discount Value ${formData.discount_type === 'Percentage' ? '(%)' : '(₹)'}`}
                                    type="number"
                                    value={formData.discount_value}
                                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                                    error={formErrors.discount_value}
                                    placeholder={formData.discount_type === 'Percentage' ? '0 - 100' : 'e.g., 50.00'}
                                    required
                                    min="0"
                                    max={formData.discount_type === 'Percentage' ? '100' : undefined}
                                    step="0.01"
                                />

                                <div className="full-width">
                                    <Input
                                        label="Description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        error={formErrors.description}
                                        placeholder="Enter a description for this discount (optional)"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Discounts;
