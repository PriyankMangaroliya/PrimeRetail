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
import { useAuth } from '../../context/AuthContext'; // Import useAuth
import taxApi from '../../api/tax.api';
import Icons from '../../components/common/Icons';

const Taxes = () => {
    const { user } = useAuth(); // Get current user
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete'
    const [selectedTax, setSelectedTax] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    const [formData, setFormData] = useState({
        tax_name: '',
        tax_rate: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchTaxes();
    }, []);

    const fetchTaxes = async () => {
        try {
            setLoading(true);
            const response = await taxApi.getAllTaxes();
            setTaxes(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch taxes');
            showAlert('error', err.message || 'Failed to fetch taxes');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    };

    const handleOpenModal = (type, tax = null) => {
        setModalType(type);
        setSelectedTax(tax);
        if (tax) {
            setFormData({
                tax_name: tax.tax_name || '',
                tax_rate: tax.tax_rate || '',
                description: tax.description || ''
            });
        } else {
            setFormData({
                tax_name: '',
                tax_rate: '',
                description: ''
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTax(null);
        setFormData({
            tax_name: '',
            tax_rate: '',
            description: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.tax_name) {
            errors.tax_name = 'Tax name is required';
        } else if (formData.tax_name.length > 50) {
            errors.tax_name = 'Tax name cannot exceed 50 characters';
        }

        if (!formData.tax_rate && formData.tax_rate !== 0) {
            errors.tax_rate = 'Tax rate is required';
        } else {
            const rate = parseFloat(formData.tax_rate);
            if (isNaN(rate)) {
                errors.tax_rate = 'Tax rate must be a number';
            } else if (rate < 0) {
                errors.tax_rate = 'Tax rate cannot be negative';
            } else if (rate > 100) {
                errors.tax_rate = 'Tax rate cannot exceed 100%';
            }
        }

        if (formData.description && formData.description.length > 500) {
            errors.description = 'Description cannot exceed 500 characters';
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
            const taxData = {
                tax_name: formData.tax_name,
                tax_rate: parseFloat(formData.tax_rate),
                description: formData.description || null
            };

            if (modalType === 'add') {
                // Add created_by for new tax
                const createData = {
                    ...taxData,
                    created_by: user?.id // Add current user as created_by
                };
                await taxApi.createTax(createData);
                showAlert('success', 'Tax created successfully');
            } else if (modalType === 'edit') {
                // Build update object with only changed fields
                const updateData = {};

                if (formData.tax_name !== selectedTax.tax_name) {
                    updateData.tax_name = formData.tax_name;
                }

                if (parseFloat(formData.tax_rate) !== parseFloat(selectedTax.tax_rate)) {
                    updateData.tax_rate = parseFloat(formData.tax_rate);
                }

                if (formData.description !== selectedTax.description) {
                    updateData.description = formData.description || null;
                }

                // Always add updated_by for any update
                updateData.updated_by = user?.id;

                await taxApi.updateTax(selectedTax.id, updateData);
                showAlert('success', 'Tax updated successfully');
            }

            fetchTaxes();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await taxApi.deleteTax(selectedTax.id);
            showAlert('success', 'Tax deleted successfully');
            fetchTaxes();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete tax');
        }
    };

    const handleToggleStatus = async (tax) => {
        try {
            await taxApi.toggleTaxStatus(tax.id);
            showAlert('success', `Tax ${!tax.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchTaxes();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Tax Name',
            key: 'tax_name',
            render: (value, record) => (
                <div className="table-info-group">
                    <span className="table-name-cell">{value}</span>
                    {record.description && (
                        <small className="sub-text" style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {record.description}
                        </small>
                    )}
                </div>
            )
        },
        {
            title: 'Tax Rate',
            key: 'tax_rate',
            render: (value) => (
                <Badge variant="primary" className="badge-code">
                    {value}%
                </Badge>
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
                <div className="table-info-group">
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small className="table-secondary-text">
                        {record.created_by_name ? `By ${record.created_by_name}` : (record.created_by ? `By User #${record.created_by}` : 'By System')}
                    </small>
                </div>
            )
        },
        {
            title: 'Updated',
            key: 'updated_at',
            render: (value, record) => (
                <div className="table-info-group">
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small className="table-secondary-text">
                        {record.updated_by_name ? `By ${record.updated_by_name}` : (record.updated_by ? `By User #${record.updated_by}` : 'By System')}
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
                                disabled={Number(record.usage_count) > 0}
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

    if (loading) {
        return (
            <MainLayout>
                <div className="page-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="common-module-container">
                <div className="page-header">
                    <div>
                        <h1>Tax Management</h1>
                        <p>Manage tax rates and configurations</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal('add')}
                        >
                            <Icons.Plus size={18} /> Create New Tax
                        </Button>
                    </div>
                </div>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="common-table-card">
                    {taxes.length > 0 ? (
                        <Table
                            columns={columns}
                            data={taxes}
                            className="common-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Taxes"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Tax size={48} />}
                            title="No Taxes Found"
                            description="Get started by creating your first tax rate"
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    Create Tax
                                </Button>
                            }
                        />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Create New Tax' :
                            modalType === 'edit' ? 'Edit Tax' :
                                modalType === 'view' ? 'Tax Details' :
                                    'Delete Tax'
                    }
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Tax
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
                                    {modalType === 'add' ? 'Create Tax' : 'Update Tax'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)" /></div>
                            <p>Are you sure you want to delete tax <strong>{selectedTax?.tax_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            <p className="delete-info">
                                Tax rate: <strong>{selectedTax?.tax_rate}%</strong>
                            </p>
                            {selectedTax?.usage_count > 0 && (
                                <p className="delete-error" style={{ color: 'var(--danger-color)', marginTop: '12px', padding: '10px', background: 'rgba(247, 37, 133, 0.1)', borderRadius: '6px' }}>
                                    Cannot delete tax assigned to {selectedTax.usage_count} item(s).
                                </p>
                            )}
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    <Icons.Tax size={32} />
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedTax?.tax_name}</h2>
                                    <div className="detail-meta">
                                        <Badge variant={selectedTax?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedTax?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="primary" className="badge-code">Rate: {selectedTax?.tax_rate}%</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-header">Tax Details</h4>
                                <div className="view-grid">
                                    <div className="view-group">
                                        <label>Tax Rate</label>
                                        <p className="price-tag">{selectedTax?.tax_rate}%</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Status</label>
                                        <p>{selectedTax?.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Currently Used By</label>
                                        <p>{selectedTax?.usage_count || 0} Products</p>
                                    </div>
                                    <div className="view-group full-width">
                                        <label>Tax Description</label>
                                        <p>{selectedTax?.description || 'No description provided for this tax rule.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="common-form">
                            <div className="common-form-grid">
                                <Input
                                    label="Tax Name"
                                    value={formData.tax_name}
                                    onChange={(e) => setFormData({ ...formData, tax_name: e.target.value })}
                                    error={formErrors.tax_name}
                                    placeholder="Enter tax name"
                                    required
                                />
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    label="Tax Rate (%)"
                                    value={formData.tax_rate}
                                    onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                    error={formErrors.tax_rate}
                                    placeholder="Enter tax rate"
                                    required
                                />
                                <div className="form-full-width">
                                    <Input
                                        label="Description"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        error={formErrors.description}
                                        placeholder="Enter tax description (optional)"
                                    />
                                </div>
                            </div>

                            {modalType === 'edit' && (
                                <div className="form-info">
                                    <small>• Status can be toggled using the action menu in the table</small>
                                    <small>• Tax rate must be between 0% and 100%</small>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Taxes;