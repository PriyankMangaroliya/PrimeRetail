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
import paymentMethodApi from '../../api/paymentMethod.api';
import Icons from '../../components/common/Icons';
import './PaymentMethods.css';

const PaymentMethods = () => {
    const { user } = useAuth();
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete', 'usage'
    const [selectedMethod, setSelectedMethod] = useState(null);
    const [usageData, setUsageData] = useState(null);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);
    const [formData, setFormData] = useState({
        method_name: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            setLoading(true);
            const response = await paymentMethodApi.getAllPaymentMethods();
            setMethods(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch payment methods');
            showAlert('error', err.message || 'Failed to fetch payment methods');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsageData = async (id) => {
        try {
            const response = await paymentMethodApi.getPaymentMethodUsage(id);
            setUsageData(response.data);
        } catch (err) {
            showAlert('error', err.message || 'Failed to fetch usage data');
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    };

    const handleOpenModal = (type, method = null) => {
        setModalType(type);
        setSelectedMethod(method);
        if (method) {
            setFormData({
                method_name: method.method_name || '',
                description: method.description || ''
            });
            if (type === 'usage') {
                fetchUsageData(method.id);
            }
        } else {
            setFormData({
                method_name: '',
                description: ''
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedMethod(null);
        setUsageData(null);
        setFormData({
            method_name: '',
            description: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.method_name) {
            errors.method_name = 'Payment method name is required';
        } else if (formData.method_name.length > 50) {
            errors.method_name = 'Payment method name cannot exceed 50 characters';
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
            const methodData = {
                method_name: formData.method_name,
                description: formData.description || null
            };

            if (modalType === 'add') {
                await paymentMethodApi.createPaymentMethod(methodData);
                showAlert('success', 'Payment method created successfully');
            } else if (modalType === 'edit') {
                const updateData = {};
                if (formData.method_name !== selectedMethod.method_name) {
                    updateData.method_name = formData.method_name;
                }
                if (formData.description !== selectedMethod.description) {
                    updateData.description = formData.description || null;
                }

                await paymentMethodApi.updatePaymentMethod(selectedMethod.id, updateData);
                showAlert('success', 'Payment method updated successfully');
            }

            fetchPaymentMethods();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await paymentMethodApi.deletePaymentMethod(selectedMethod.id);
            showAlert('success', 'Payment method deleted successfully');
            fetchPaymentMethods();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete payment method');
        }
    };

    const handleToggleStatus = async (method) => {
        try {
            await paymentMethodApi.togglePaymentMethodStatus(method.id);
            showAlert('success', `Payment method ${!method.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchPaymentMethods();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="method-no">{index + 1}</span>
        },
        {
            title: 'Payment Method',
            key: 'method_name',
            render: (value, record) => (
                <div className="method-name-cell">
                    <strong>{value}</strong>
                    {record.description && (
                        <small className="method-description">{record.description}</small>
                    )}
                </div>
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
                        {record.created_by_name ? `By ${record.created_by_name}` : (record.created_by ? `By User #${record.created_by}` : 'By System')}
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
                        {record.updated_by_name ? `By ${record.updated_by_name}` : (record.updated_by ? `By User #${record.updated_by}` : 'By System')}
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
                            <button onClick={() => { handleOpenModal('usage', record); setActiveDropdown(null); }}>
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
                                disabled={Number(record.usage_count) > 0}
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
                <div className="methods-loading">
                    <Loader size="large" />
                    <p>Loading payment methods...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="methods-container">
                {/* Header */}
                <div className="methods-header">
                    <div>
                        <h1>Payment Method Management</h1>
                        <p>Manage payment methods and configurations</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal('add')}
                        >
                            <Icons.Plus size={18} /> Create Payment Method
                        </Button>
                    </div>
                </div>

                {/* Alert */}
                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Payment Methods Table */}
                <Card className="methods-table-card">
                    {methods.length > 0 ? (
                        <Table
                            columns={columns}
                            data={methods}
                            className="methods-table"
                            searchable={false}
                            columnSearchable={true}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.CreditCard size={48} />}
                            title="No Payment Methods Found"
                            description="Get started by creating your first payment method"
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    <Icons.Plus size={18} /> Create Payment Method
                                </Button>
                            }
                        />
                    )}
                </Card>

                {/* Payment Method Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Create New Payment Method' :
                            modalType === 'edit' ? 'Edit Payment Method' :
                                modalType === 'usage' ? 'Payment Method Usage' :
                                    'Delete Payment Method'
                    }
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Method
                                </Button>
                            </>
                        ) : modalType === 'usage' ? (
                            <Button variant="primary" onClick={handleCloseModal}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Method' : 'Update Method'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete payment method <strong>{selectedMethod?.method_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            {selectedMethod?.usage_count > 0 && (
                                <p className="delete-error">
                                    Cannot delete payment method used in {selectedMethod.usage_count} transaction(s).
                                </p>
                            )}
                        </div>
                    ) : modalType === 'usage' ? (
                        <div className="usage-details">
                            <div className="usage-icon"><Icons.CreditCard size={48} color="var(--primary-color)" /></div>
                            <h3>{selectedMethod?.method_name}</h3>
                            <div className="usage-stats">
                                <div className="usage-stat-item">
                                    <span className="usage-label">Total Transactions</span>
                                    <span className="usage-value">{usageData?.usage_count || 0}</span>
                                </div>
                                <div className="usage-stat-item">
                                    <span className="usage-label">Status</span>
                                    <Badge variant={selectedMethod?.is_active ? 'success' : 'danger'}>
                                        {selectedMethod?.is_active ? 'Active' : 'Inactive'}
                                    </Badge>
                                </div>
                                {selectedMethod?.description && (
                                    <div className="usage-stat-item">
                                        <span className="usage-label">Description</span>
                                        <span className="usage-description">{selectedMethod.description}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="method-form">
                            <Input
                                label="Payment Method Name"
                                value={formData.method_name}
                                onChange={(e) => setFormData({...formData, method_name: e.target.value})}
                                error={formErrors.method_name}
                                placeholder="e.g., Cash, Credit Card, UPI, Bank Transfer"
                                required
                            />

                            <TextArea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                error={formErrors.description}
                                placeholder="Enter payment method description (optional)"
                                rows={3}
                            />

                            {modalType === 'edit' && (
                                <div className="form-info">
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

export default PaymentMethods;