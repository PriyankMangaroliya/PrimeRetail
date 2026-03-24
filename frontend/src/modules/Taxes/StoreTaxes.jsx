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
import storeTaxApi from '../../api/storeTax.api';
import taxApi from '../../api/tax.api';
import Icons from '../../components/common/Icons';

const StoreTaxes = () => {
    const { user } = useAuth();
    const [storeTaxes, setStoreTaxes] = useState([]);
    const [availableTaxes, setAvailableTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add' | 'delete' | 'view'
    const [selectedTax, setSelectedTax] = useState(null);
    const [usageProducts, setUsageProducts] = useState([]);
    const [isUsageLoading, setIsUsageLoading] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const isStoreOwner = user?.role_name === 'Store Owner';

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isStoreOwner) {
            fetchData();
        } else {
            setLoading(false);
        }
    }, [isStoreOwner]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [storeRes, globalRes] = await Promise.all([
                storeTaxApi.getStoreTaxes(),
                taxApi.getActiveTaxes()
            ]);
            setStoreTaxes(storeRes.data || []);
            setAvailableTaxes(globalRes.data || []);
        } catch (err) {
            showAlert('error', err.message || 'Failed to fetch taxes');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
    };

    const handleOpenModal = async (type, tax = null) => {
        setModalType(type);
        setSelectedTax(tax);
        setShowModal(true);

        if ((type === 'view' || type === 'delete') && tax) {
            fetchUsage(tax.id);
        }
    };

    const fetchUsage = async (id) => {
        try {
            setIsUsageLoading(true);
            const response = await storeTaxApi.getTaxUsage(id);
            setUsageProducts(response.data.products || []);
        } catch (err) {
            showAlert('error', 'Failed to fetch usage data');
        } finally {
            setIsUsageLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedTax(null);
        setUsageProducts([]);
        setSearchTerm('');
    };

    const handleAddTax = async (taxId) => {
        try {
            await storeTaxApi.addStoreTax(taxId);
            showAlert('success', 'Tax added successfully');
            fetchData();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to add tax');
        }
    };

    const handleRemoveTax = async () => {
        try {
            await storeTaxApi.removeStoreTax(selectedTax.id);
            showAlert('success', 'Tax removed successfully');
            fetchData();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to remove tax');
        }
    };

    const handleToggleStatus = async (tax) => {
        try {
            const newStatus = !tax.is_active;
            await storeTaxApi.toggleStoreTaxStatus(tax.id, newStatus);
            showAlert('success', `Tax ${newStatus ? 'activated' : 'deactivated'} successfully`);
            fetchData();
        } catch (err) {
            showAlert('error', err.message || 'Failed to toggle status');
        }
    };

    // Filter available taxes that are not already in storeTaxes
    const filteredAvailableTaxes = availableTaxes.filter(globalTax => {
        const alreadyAdded = storeTaxes.some(st => st.tax_id === globalTax.id);
        const matchesSearch = globalTax.tax_name.toLowerCase().includes(searchTerm.toLowerCase());
        return !alreadyAdded && matchesSearch;
    });

    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Name',
            key: 'tax_name',
            className: 'table-name-cell'
        },
        {
            title: 'Rate',
            key: 'tax_rate',
            render: (value) => (
                <Badge variant="primary" className="badge-code">
                    {parseFloat(value).toFixed(2)} %
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
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="common-action-menu" onClick={(e) => e.stopPropagation()}>
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
                                {record.is_active ?
                                    <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> :
                                    <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>
                                }
                            </button>
                            <button
                                onClick={() => { handleOpenModal('delete', record); setActiveDropdown(null); }}
                                className="action-item delete-item"
                            >
                                <Icons.Delete size={16} /> Remove
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const availableTaxColumns = [
        {
            title: 'Tax Name',
            key: 'tax_name',
            className: 'table-name-cell'
        },
        {
            title: 'Rate',
            key: 'tax_rate',
            render: (val) => <Badge variant="primary" className="badge-code">{parseFloat(val).toFixed(2)}%</Badge>
        },
        {
            title: 'Description',
            key: 'description',
            render: (val) => <span className="sub-text" style={{ fontSize: '13px' }}>{val || 'No description'}</span>
        },
        {
            title: 'Action',
            key: 'action',
            render: (_, record) => (
                <Button variant="primary" size="small" onClick={() => handleAddTax(record.id)}>
                    <Icons.Plus size={14} /> Add
                </Button>
            )
        }
    ];

    if (!isStoreOwner) {
        return (
            <MainLayout>
                <div className="common-module-container">
                    <div className="page-header">
                        <h1>Tax Management</h1>
                    </div>
                    <Card className="common-table-card">
                        <EmptyState
                            icon={<Icons.Lock size={48} />}
                            title="Access Restricted"
                            description="Only Store Owners can manage taxes for their store."
                        />
                    </Card>
                </div>
            </MainLayout>
        );
    }

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
                        <p>Manage taxes for your products</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => handleOpenModal('add')}>
                            <Icons.Plus size={18} /> Add Tax for Store
                        </Button>
                    </div>
                </div>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="common-table-card">
                    {storeTaxes.length > 0 ? (
                        <Table
                            columns={columns}
                            data={storeTaxes}
                            className="common-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Store Taxes"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Percent size={48} />}
                            title="No Taxes Selected"
                            description="You haven't selected any taxes for your store yet. Select taxes from the global list to apply them to your products."
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    <Icons.Plus size={18} /> Select Tax
                                </Button>
                            }
                        />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Select Tax from Global List' :
                            modalType === 'view' ? 'Tax Details' :
                                'Remove Tax'
                    }
                    size={modalType === 'add' ? 'large' : 'medium'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button
                                    variant="danger"
                                    onClick={handleRemoveTax}
                                    disabled={usageProducts.length > 0}
                                >
                                    Remove Tax
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={handleCloseModal}>Close</Button>
                        )
                    }
                >
                    {modalType === 'add' ? (
                        <div className="tax-selection-modal">
                            <div className="search-box" style={{ marginBottom: '20px' }}>
                                <Input
                                    placeholder="Search available taxes..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    prefix={<Icons.Search size={18} />}
                                />
                            </div>
                            <div className="available-taxes-list">
                                {filteredAvailableTaxes.length > 0 ? (
                                    <div style={{ border: '1px solid var(--gray-100)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <Table
                                            columns={availableTaxColumns}
                                            data={filteredAvailableTaxes}
                                            className="common-table"
                                            searchable={false}
                                            itemsPerPage={10}
                                        />
                                    </div>
                                ) : (
                                    <EmptyState
                                        icon={<Icons.Search size={32} />}
                                        title="No Taxes Found"
                                        description={searchTerm ? "No taxes match your search term." : "All available active taxes have already been added to your store."}
                                    />
                                )}
                            </div>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    <Icons.Percent size={32} />
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedTax?.tax_name}</h2>
                                    <div className="detail-meta">
                                        <Badge variant={selectedTax?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedTax?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <Badge variant="primary" className="badge-code">Rate: {parseFloat(selectedTax?.tax_rate || 0).toFixed(2)}%</Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-header">Tax Information</h4>
                                <div className="view-grid">
                                    <div className="view-group">
                                        <label>Tax Rate</label>
                                        <p className="price-tag">{parseFloat(selectedTax?.tax_rate || 0).toFixed(2)}%</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Store Status</label>
                                        <p>{selectedTax?.is_active ? 'Active' : 'Inactive'}</p>
                                    </div>
                                    <div className="view-group full-width">
                                        <label>Tax Description</label>
                                        <p>{selectedTax?.description || 'No description provided for this tax rule.'}</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            {isUsageLoading ? (
                                <Loader size="small" />
                            ) : usageProducts.length > 0 ? (
                                <div className="warning-banner-flat mt-16">
                                    <p>Cannot remove <strong>{selectedTax?.tax_name}</strong> as it is being used by <strong>{usageProducts.length}</strong> products.</p>
                                    <p style={{ marginTop: '8px', fontWeight: '500' }}>Please deactivate this tax instead or remove it from these products first:</p>
                                    <div style={{ marginTop: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                                        <ul style={{ margin: '0', paddingLeft: '20px', fontSize: '13px' }}>
                                            {usageProducts.map(p => <li key={p.id}>{p.product_name} ({p.sku})</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-16 text-center">
                                    <p>Are you sure you want to remove <strong>{selectedTax?.tax_name}</strong> from your store?</p>
                                    <p className="sub-text mt-8">This action cannot be undone if no products are using this tax.</p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default StoreTaxes;
