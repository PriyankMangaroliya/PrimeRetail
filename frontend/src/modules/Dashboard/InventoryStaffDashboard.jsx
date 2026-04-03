import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Table from '../../components/common/Table/Table';
import Icons from '../../components/common/Icons';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Select from '../../components/common/Select/Select';
import Alert from '../../components/common/Alert/Alert';
import dashboardApi from '../../api/dashboard.api';
import inventoryApi from '../../api/inventory.api';
import productApi from '../../api/product.api';
import '../../styles/dashboard.css';

const movementsDecreasingStock = ['SELL', 'DAMAGED', 'MANUAL_REMOVE', 'TRANSFER'];
const movementsIncreasingStock = ['ADD', 'RETURN', 'EXCHANGE', 'MANUAL_ADD'];

const InventoryStaffDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        totalLowStock: 0,
        totalOutOfStock: 0,
        lowStockProducts: [],
        outOfStockProducts: []
    });
    const [loading, setLoading] = useState(true);

    // Modal & Advanced States
    const [showModal, setShowModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedStock, setSelectedStock] = useState(null);
    const [activeProducts, setActiveProducts] = useState([]);
    const [activeLocations, setActiveLocations] = useState([]);
    const [formData, setFormData] = useState({
        movement_type: '',
        quantity: '',
        notes: '',
        destination_location_type: '',
        destination_location_id: '',
        reference_id: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
    const [exchangeProductSearch, setExchangeProductSearch] = useState('');
    const [exchangeProductDropdownOpen, setExchangeProductDropdownOpen] = useState(false);
    const [selectedExchangeProduct, setSelectedExchangeProduct] = useState(null);

    const isInventory = user?.role_name === 'Inventory Staff';

    const getMovementOptions = () => {
        if (isInventory) return ['TRANSFER', 'DAMAGED', 'RETURN', 'EXCHANGE', 'MANUAL_ADD', 'MANUAL_REMOVE'];
        return [];
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const fetchAdvancedData = async () => {
        try {
            const [prodRes, locRes] = await Promise.all([
                productApi.getAllProducts(),
                inventoryApi.getActiveLocations()
            ]);
            setActiveProducts((prodRes.data?.products || prodRes.data || []).filter(p => p.is_active !== false));
            setActiveLocations(locRes.data || []);
        } catch (e) {
            console.error("Could not fetch auxiliary data for modal", e);
        }
    };

    const handleOpenModal = (record) => {
        const options = getMovementOptions();
        setSelectedProduct({
            id: record.product_id,
            product_name: record.product_name,
            sku: record.sku
        });
        setSelectedStock({
            id: record.stock_id,
            quantity: record.quantity,
            location_type: 'Store',
            location_id: user.store_id
        });
        setFormData({
            movement_type: options[0] || 'TRANSFER',
            quantity: '',
            notes: '',
            destination_location_type: '',
            destination_location_id: '',
            reference_id: ''
        });
        setExchangeProductSearch('');
        setSelectedExchangeProduct(null);
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!selectedProduct) return { product: 'Required' };
        if (!formData.movement_type) errors.movement_type = 'Required';
        if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
            errors.quantity = 'Invalid quantity';
        }
        if (selectedStock && movementsDecreasingStock.includes(formData.movement_type) && parseInt(formData.quantity) > selectedStock.quantity) {
            errors.quantity = `Insufficient stock (${selectedStock.quantity})`;
        }
        if (formData.movement_type === 'EXCHANGE' && !selectedExchangeProduct) {
            errors.exchange_product = 'Required';
        }
        if (formData.movement_type === 'TRANSFER' && !formData.destination_location_id) {
            errors.destination = 'Required';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const payload = {
                product_id: selectedProduct.id,
                stock_id: selectedStock?.id || null,
                movement_type: formData.movement_type,
                quantity: parseInt(formData.quantity),
                notes: formData.notes,
                reference_id: formData.reference_id,
                source_location_type: null,
                source_location_id: null,
                destination_location_type: null,
                destination_location_id: null,
                exchange_product_id: selectedExchangeProduct?.id || null
            };

            if (movementsIncreasingStock.includes(formData.movement_type)) {
                payload.destination_location_type = 'Store';
                payload.destination_location_id = user.store_id;
            }
            if (movementsDecreasingStock.includes(formData.movement_type)) {
                payload.source_location_type = 'Store';
                payload.source_location_id = user.store_id;
            }
            if (formData.movement_type === 'TRANSFER') {
                payload.destination_location_type = formData.destination_location_type;
                payload.destination_location_id = formData.destination_location_id;
            }

            await inventoryApi.createTransaction(payload);
            showAlert('success', 'Stock updated successfully');
            setShowModal(false);
            fetchStats();
        } catch (error) {
            showAlert('danger', error.response?.data?.message || 'Failed to update stock');
        }
    };

    const stockColumns = [
        {
            title: 'Product',
            key: 'product_name'
        },
        {
            title: 'SKU',
            key: 'sku',
            render: (val) => <Badge variant="primary">{val}</Badge>
        },
        {
            title: 'Stock',
            key: 'quantity',
            render: (val) => <Badge variant="danger">{val}</Badge>
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        size="small"
                        variant="outline"
                        title="View Transactions"
                        onClick={() => navigate(`/inventory/transactions?product_id=${record.product_id}`)}
                    >
                        <Icons.View size={14} />
                    </Button>
                    <Button
                        size="small"
                        variant="outline"
                        title="Manage Stock"
                        onClick={() => handleOpenModal(record)}
                    >
                        <Icons.Settings size={14} />
                    </Button>
                </div>
            )
        }
    ];

    useEffect(() => {
        fetchStats();
        fetchAdvancedData();

        const handleClickOutside = (e) => {
            if (!e.target.closest('.custom-search-dropdown')) {
                setDestinationDropdownOpen(false);
                setExchangeProductDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getStats();
            if (response.success) {
                setStats(response.data);
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Inventory Staff Dashboard</h1>
                        <p>Track and manage store inventory</p>
                    </div>
                    <Button onClick={fetchStats} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {alert.show && (
                    <Alert type={alert.type} dismissible onClose={() => setAlert({ ...alert, show: false })}>
                        {alert.message}
                    </Alert>
                )}

                {/* Inventory Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Package size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Products</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalProducts}</p>
                            <Badge variant="success">In Catalog</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.BarChart size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stock</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalStock.toLocaleString()}</p>
                            <Badge variant="success">Items</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon warning"><Icons.TrendingDown size={24} /></div>
                        <div className="stat-content">
                            <h3>Low Stock</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalLowStock}</p>
                            <Badge variant="warning">Action Needed</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon danger"><Icons.AlertCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>Out of Stock</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalOutOfStock}</p>
                            <Badge variant="danger">Critical</Badge>
                        </div>
                    </Card>
                </div>

                {/* Inventory Alerts Tables */}
                <div className="tasks-grid" style={{ marginTop: '24px' }}>
                    <Card className="tasks-card">
                        <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icons.TrendingDown size={18} color="var(--warning-color)" />
                                <h3 style={{ margin: 0 }}>Low Stock Products</h3>
                            </div>
                            <Badge variant="warning">{stats.totalLowStock} Items</Badge>
                        </div>
                        <div className="inventory-table-container">
                            <Table
                                columns={stockColumns}
                                data={stats.lowStockProducts || []}
                                className="dashboard-table"
                                searchable={false}
                                initialItemsPerPage={5}
                            />
                        </div>
                    </Card>

                    <Card className="tasks-card">
                        <div className="card-header" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', paddingBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Icons.AlertCircle size={18} color="var(--danger-color)" />
                                <h3 style={{ margin: 0 }}>Out of Stock Products</h3>
                            </div>
                            <Badge variant="danger">{stats.totalOutOfStock} Items</Badge>
                        </div>
                        <div className="inventory-table-container">
                            <Table
                                columns={stockColumns}
                                data={stats.outOfStockProducts || []}
                                className="dashboard-table"
                                searchable={false}
                                initialItemsPerPage={5}
                            />
                        </div>
                    </Card>
                </div>

                {/* Manage Stock Modal (Full Sync with StockList) */}
                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Manage Stock"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSubmit}>Update Stock</Button>
                        </>
                    }
                >
                    <div className="common-form">
                        {selectedProduct && (
                            <div className="selection-result-card" style={{ marginBottom: '16px' }}>
                                <div className="entity-info">
                                    <div className="entity-icon">
                                        <Icons.Package size={20} />
                                    </div>
                                    <div className="entity-details">
                                        <span className="entity-name">{selectedProduct.product_name}</span>
                                        <span className="entity-sub">
                                            SKU: {selectedProduct.sku} • {selectedStock?.quantity || 0} Units Available
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="form-card" style={{ padding: '20px', marginBottom: '16px' }}>
                            <div className="form-section-title" style={{ marginTop: 0, marginBottom: '16px' }}>
                                <span className="icon"><Icons.Settings size={14} /></span>
                                Transaction Details
                            </div>

                            <div className="common-form-grid" style={{ gap: '16px', marginBottom: (formData.movement_type === 'EXCHANGE' || formData.movement_type === 'TRANSFER') ? '16px' : 0 }}>
                                <Select
                                    label="Movement Type"
                                    required
                                    value={formData.movement_type}
                                    onChange={(e) => setFormData({ ...formData, movement_type: e.target.value })}
                                    options={getMovementOptions().map(opt => ({ value: opt, label: opt }))}
                                />

                                <Input
                                    label="Quantity"
                                    type="number"
                                    min="1"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    error={formErrors.quantity}
                                    required
                                />
                            </div>

                            {formData.movement_type === 'EXCHANGE' && (
                                <div className="form-group custom-search-dropdown" style={{ position: 'relative' }}>
                                    {selectedExchangeProduct ? (
                                        <div className="selection-result-card" style={{ marginTop: '4px' }}>
                                            <div className="entity-info">
                                                <div className="entity-icon" style={{ background: 'var(--warning-light)', color: 'var(--warning-color)' }}>
                                                    <Icons.Package size={18} />
                                                </div>
                                                <div className="entity-details">
                                                    <span className="entity-name">{selectedExchangeProduct.product_name}</span>
                                                    <span className="entity-sub">SKU: {selectedExchangeProduct.sku}</span>
                                                </div>
                                            </div>
                                            <div className="entity-action" onClick={() => { setSelectedExchangeProduct(null); setExchangeProductSearch(''); }} title="Change Product">
                                                <Icons.RefreshCw size={14} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <Input
                                                label="Select New Product (for Exchange)"
                                                required
                                                type="text"
                                                placeholder="Search target product..."
                                                value={exchangeProductSearch}
                                                onChange={(e) => {
                                                    setExchangeProductSearch(e.target.value);
                                                    setExchangeProductDropdownOpen(true);
                                                    setSelectedExchangeProduct(null);
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setExchangeProductDropdownOpen(!exchangeProductDropdownOpen);
                                                }}
                                                error={formErrors.exchange_product}
                                                icon={<Icons.ChevronDown size={16} />}
                                            />
                                            {exchangeProductDropdownOpen && (
                                                <div className="search-dropdown-menu">
                                                    {activeProducts
                                                        .filter(p => p.id !== selectedProduct?.id)
                                                        .filter(p => `${p.product_name} ${p.sku}`.toLowerCase().includes(exchangeProductSearch.toLowerCase()))
                                                        .map(p => (
                                                            <div
                                                                key={p.id}
                                                                className="search-dropdown-item"
                                                                onClick={() => {
                                                                    setSelectedExchangeProduct(p);
                                                                    setExchangeProductSearch(`${p.product_name} (SKU: ${p.sku})`);
                                                                    setExchangeProductDropdownOpen(false);
                                                                }}
                                                            >
                                                                <span className="search-item-title">{p.product_name}</span>
                                                                <div className="search-item-sub">SKU: {p.sku}</div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.movement_type === 'TRANSFER' && (
                                <div className="form-group custom-search-dropdown" style={{ position: 'relative' }}>
                                    {formData.destination_location_id ? (
                                        <div className="selection-result-card" style={{ marginTop: '4px' }}>
                                            <div className="entity-info">
                                                <div className="entity-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                                                    {formData.destination_location_type === 'Store' ? <Icons.Store size={18} /> : <Icons.Warehouse size={18} />}
                                                </div>
                                                <div className="entity-details">
                                                    <span className="entity-name">
                                                        {activeLocations.find(l => l.id === formData.destination_location_id && l.type === formData.destination_location_type)?.name}
                                                    </span>
                                                    <span className="entity-sub">
                                                        {formData.destination_location_type} • {activeLocations.find(l => l.id === formData.destination_location_id && l.type === formData.destination_location_type)?.code}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="entity-action" onClick={() => setFormData({ ...formData, destination_location_id: null, destination_location_type: '' })} title="Change Location">
                                                <Icons.RefreshCw size={14} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div style={{ position: 'relative' }}>
                                            <label className="input-label">Destination Location <span className="required">*</span></label>
                                            <div
                                                className="input-field"
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                    cursor: 'pointer', background: 'var(--input-bg)', padding: '0 12px',
                                                    borderRadius: '8px', border: '1px solid var(--input-border)',
                                                    height: 'var(--input-height)', marginTop: '6px'
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDestinationDropdownOpen(!destinationDropdownOpen);
                                                }}
                                            >
                                                <div style={{ flex: 1, color: 'var(--text-muted)' }}>Select Destination...</div>
                                                <Icons.ChevronDown size={14} style={{ color: 'var(--gray-400)' }} />
                                            </div>

                                            {destinationDropdownOpen && (
                                                <div className="search-dropdown-menu" style={{ top: '100%', marginTop: '4px' }}>
                                                    {activeLocations
                                                        .filter(l => !(l.type === 'Store' && l.id === user.store_id))
                                                        .map(l => (
                                                            <div
                                                                key={`${l.type}-${l.id}`}
                                                                className="search-dropdown-item"
                                                                onClick={() => {
                                                                    setFormData({
                                                                        ...formData,
                                                                        destination_location_type: l.type,
                                                                        destination_location_id: l.id
                                                                    });
                                                                    setDestinationDropdownOpen(false);
                                                                }}
                                                            >
                                                                <span className="search-item-title">{l.name}</span>
                                                                <div className="search-item-sub">
                                                                    {l.type} • {l.code || `#${l.id}`}
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {formErrors.destination && <p className="error-message" style={{ color: 'var(--danger-color)', fontSize: '12px', marginTop: '4px' }}>{formErrors.destination}</p>}
                                </div>
                            )}
                        </div>

                        <div className="form-card" style={{ padding: '20px', marginBottom: 0 }}>
                            <div className="form-section-title" style={{ marginTop: 0, marginBottom: '16px' }}>
                                <span className="icon"><Icons.FileText size={14} /></span>
                                Additional Information
                            </div>

                            <div className="common-form-grid" style={{ gap: '16px' }}>
                                <Input
                                    type="text"
                                    label="Reference / Invoice"
                                    value={formData.reference_id || ''}
                                    onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                                    placeholder="Ref No. (Optional)"
                                />

                                <Input
                                    type="text"
                                    label="Notes / Reason"
                                    value={formData.notes || ''}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    placeholder="Reason for change..."
                                />
                            </div>
                        </div>
                    </div>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default InventoryStaffDashboard;
