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
import './StoreTaxes.css';

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
                <span className="dc-value">
                    {parseFloat(value).toFixed(2)} %
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

    const usageColumns = [
        {
            title: 'Product Name',
            key: 'product_name',
            className: 'table-name-cell'
        },
        {
            title: 'SKU',
            key: 'sku',
        },
        {
            title: 'Category',
            key: 'category_name',
            render: (val) => val || 'N/A'
        },
        {
            title: 'Price',
            key: 'price',
            render: (val, record) => `₹${parseFloat(val).toFixed(2)} / ${record.unit}`
        }
    ];

    if (!isStoreOwner) {
        return (
            <MainLayout>
                <div className="taxes-container">
                    <div className="taxes-header">
                        <h1>Tax Management</h1>
                    </div>
                    <Card className="taxes-table-card">
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
                <div className="taxes-loading">
                    <Loader size="large" />
                    <p>Loading your taxes...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="taxes-container">
                <div className="taxes-header">
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

                <Card className="taxes-table-card">
                    {storeTaxes.length > 0 ? (
                        <Table
                            columns={columns}
                            data={storeTaxes}
                            className="store-taxes-table"
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
                            <div className="available-taxes-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {filteredAvailableTaxes.length > 0 ? (
                                    <div className="tax-grid">
                                        {filteredAvailableTaxes.map(tax => (
                                            <Card key={tax.id} className="tax-select-card">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                    <div>
                                                        <h4>{tax.tax_name}</h4>
                                                        <Badge variant="info">{tax.tax_rate}%</Badge>
                                                    </div>
                                                    <Button variant="outline" size="small" onClick={() => handleAddTax(tax.id)}>
                                                        <Icons.Plus size={14} /> Add
                                                    </Button>
                                                </div>
                                                <p>{tax.description || 'No description available'}</p>
                                            </Card>
                                        ))}
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
                        <div className="tax-view">
                            <div className="dc-details-view" style={{ paddingBottom: '15px', marginBottom: '15px' }}>
                                <div className="dc-brand-icon">
                                    <div className="dc-icon-large">
                                        <Icons.Percent size={40} />
                                    </div>
                                </div>
                                <div className="dc-info-text">
                                    <h3>{selectedTax?.tax_name}</h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        <Badge variant={selectedTax?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedTax?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                        <span className="dc-value-large">
                                            {parseFloat(selectedTax?.tax_rate || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="usage-section">
                                <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Icons.Package size={20} color="var(--primary-color)" />
                                    Products Using This Tax
                                </h4>
                                {isUsageLoading ? (
                                    <div style={{ textAlign: 'center', padding: '20px' }}>
                                        <Loader size="small" />
                                        <p style={{ marginTop: '10px', color: 'var(--gray-500)' }}>Fetching products...</p>
                                    </div>
                                ) : usageProducts.length > 0 ? (
                                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '8px' }}>
                                        <Table
                                            columns={usageColumns}
                                            data={usageProducts}
                                            className="usage-table"
                                            searchable={false}
                                            itemsPerPage={5}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '30px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                                        <p style={{ color: 'var(--gray-600)' }}>No products are currently using this tax rate.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            {isUsageLoading ? (
                                <Loader size="small" />
                            ) : usageProducts.length > 0 ? (
                                <div className="usage-warning">
                                    <p>Cannot remove <strong>{selectedTax?.tax_name}</strong> as it is being used by <strong>{usageProducts.length}</strong> products.</p>
                                    <p className="delete-warning">Please deactivate this tax instead to prevent further use while keeping existing records consistent.</p>
                                    <div style={{ marginTop: '15px', padding: '10px', background: 'var(--gray-100)', borderRadius: '8px', maxHeight: '150px', overflowY: 'auto' }}>
                                        <ul style={{ paddingLeft: '20px', fontSize: '0.9em' }}>
                                            {usageProducts.map(p => <li key={p.id}>{p.product_name} ({p.sku})</li>)}
                                        </ul>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <p>Are you sure you want to remove <strong>{selectedTax?.tax_name}</strong> from your store?</p>
                                    <p className="delete-warning">This action cannot be undone if no products are using this tax.</p>
                                </>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default StoreTaxes;
