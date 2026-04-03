import React, { useState, useEffect } from 'react';
import Icons from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import inventoryApi from '../../api/inventory.api';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import Select from '../../components/common/Select/Select';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useNavigate } from 'react-router-dom';
import './InventoryStock.css';

const movementsDecreasingStock = ['SELL', 'DAMAGED', 'MANUAL_REMOVE', 'TRANSFER'];
const movementsIncreasingStock = ['ADD', 'RETURN', 'EXCHANGE', 'MANUAL_ADD'];

const StockList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isOwner = user?.role_name === 'Store Owner';
    const isManager = user?.role_name === 'Store Manager';
    const isCashier = user?.role_name === 'Cashier';
    const isInventory = user?.role_name === 'Inventory Staff';
    const isWarehouse = user?.role_name === 'Warehouse Staff';

    const canManageStock = isInventory || isWarehouse;

    const getMovementOptions = () => {
        if (isWarehouse) return ['ADD', 'TRANSFER', 'DAMAGED', 'MANUAL_ADD', 'MANUAL_REMOVE'];
        if (isInventory) return ['TRANSFER', 'DAMAGED', 'RETURN', 'EXCHANGE', 'MANUAL_ADD', 'MANUAL_REMOVE'];
        if (isCashier) return ['SELL'];
        return [];
    };

    const [stock, setStock] = useState([]);
    const [activeProducts, setActiveProducts] = useState([]);
    const [activeLocations, setActiveLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productSearch, setProductSearch] = useState('');
    const [destinationSearch, setDestinationSearch] = useState('');
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const [formData, setFormData] = useState({
        movement_type: '',
        quantity: '',
        notes: '',
        destination_location_type: '',
        destination_location_id: '',
        reference_id: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);
    const [exchangeProductSearch, setExchangeProductSearch] = useState('');
    const [exchangeProductDropdownOpen, setExchangeProductDropdownOpen] = useState(false);
    const [selectedExchangeProduct, setSelectedExchangeProduct] = useState(null);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.common-action-menu')) {
                setActiveDropdown(null);
            }
            if (!e.target.closest('.custom-search-dropdown')) {
                setProductDropdownOpen(false);
                setDestinationDropdownOpen(false);
                setExchangeProductDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchStock();
    }, []);

    const fetchStock = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getAllStock();
            setStock(res.data || []);

            // Fetch products for the consolidated Manage Stock modal
            if (canManageStock) {
                try {
                    const { default: productApi } = await import('../../api/product.api.js');
                    const prodRes = await productApi.getAllProducts();
                    const products = prodRes.data?.products || prodRes.data || [];
                    setActiveProducts(products.filter(p => p.is_active !== false));
                } catch (e) {
                    console.error("Could not fetch product list", e);
                }
            }
            // Fetch locations for Transfer functionality
            if (isWarehouse || isInventory) {
                try {
                    const locRes = await inventoryApi.getActiveLocations();
                    setActiveLocations(locRes.data || []);
                } catch (e) {
                    console.error("Could not fetch active locations", e);
                }
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch stock';
            showAlert('danger', errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const handleOpenModal = (stockItem = null) => {
        if (stockItem) {
            setSelectedProduct({
                id: stockItem.product_id,
                product_name: stockItem.product_name,
                sku: stockItem.sku
            });
            setSelectedStock(stockItem);
            setProductSearch(`${stockItem.product_name} (SKU: ${stockItem.sku})`);
        } else {
            setSelectedProduct(null);
            setSelectedStock(null);
            setProductSearch('');
        }

        const options = getMovementOptions();
        setFormData({
            movement_type: stockItem ? (options[0] || '') : (options.includes('ADD') ? 'ADD' : options[0] || ''),
            quantity: '',
            notes: '',
            destination_location_type: '',
            destination_location_id: '',
            reference_id: ''
        });
        setExchangeProductSearch('');
        setDestinationSearch('');
        setSelectedExchangeProduct(null);
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!selectedProduct) {
            errors.product_id = 'Please select a product';
            return errors;
        }
        if (!formData.movement_type) {
            errors.movement_type = 'Movement type is required';
        }
        if (!formData.quantity || isNaN(formData.quantity) || parseInt(formData.quantity) <= 0) {
            errors.quantity = 'Please enter a valid quantity';
        }

        if (selectedStock && movementsDecreasingStock.includes(formData.movement_type) && parseInt(formData.quantity) > selectedStock.quantity) {
            errors.quantity = `Insufficient stock. Current: ${selectedStock.quantity}`;
        }


        if (formData.movement_type === 'EXCHANGE' && !selectedExchangeProduct) {
            errors.exchange_product = 'Please select a new product for exchange';
        }

        if (formData.movement_type === 'TRANSFER') {
            if (!formData.destination_location_id) {
                errors.destination = 'Please select a destination location';
            } else if (formData.destination_location_id === selectedStock?.location_id && formData.destination_location_type === selectedStock?.location_type) {
                errors.destination = 'Destination cannot be the same as current location';
            }
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

            if (formData.movement_type === 'ADD' && !selectedStock) {
                // If it's a new ADD for a product that doesn't exist in the current location (owner/manager view)
                // We need to know WHICH location to add to. 
                // However, for Staff/Cashier, their location is fixed/implied.
                // For simplicity in this UI, we use the user's primary location if not selected.
                if (isWarehouse) {
                    payload.destination_location_type = 'Warehouse';
                    payload.destination_location_id = user.warehouse_id;
                } else if (isInventory || isCashier || isManager) {
                    payload.destination_location_type = 'Store';
                    payload.destination_location_id = user.store_id;
                }
            }

            if (movementsIncreasingStock.includes(formData.movement_type)) {
                if (selectedStock) {
                    payload.destination_location_type = selectedStock.location_type;
                    payload.destination_location_id = selectedStock.location_id;
                } else {
                    // Fallback to user's location for ADD/RETURN/etc.
                    payload.destination_location_type = isWarehouse ? 'Warehouse' : 'Store';
                    payload.destination_location_id = isWarehouse ? user.warehouse_id : user.store_id;
                }
            }

            if (movementsDecreasingStock.includes(formData.movement_type)) {
                if (selectedStock) {
                    payload.source_location_type = selectedStock.location_type;
                    payload.source_location_id = selectedStock.location_id;
                } else {
                    // Fallback to user's location for SELL/DAMAGED/etc.
                    payload.source_location_type = isWarehouse ? 'Warehouse' : 'Store';
                    payload.source_location_id = isWarehouse ? user.warehouse_id : user.store_id;
                }
            }

            if (formData.movement_type === 'TRANSFER') {
                payload.destination_location_type = formData.destination_location_type;
                payload.destination_location_id = formData.destination_location_id;
            }

            await inventoryApi.createTransaction(payload);
            showAlert('success', 'Stock transaction recorded successfully');

            setShowModal(false);
            fetchStock();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to process transaction';
            showAlert('danger', errorMsg);
        }
    };



    const columns = [
        {
            title: 'No',
            key: 'id',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'SKU',
            key: 'sku',
            render: (value) => <Badge variant="primary" className="badge-code">{value}</Badge>
        },
        {
            title: 'Product',
            key: 'product_name',
            className: 'table-name-cell'
        },

        // Location column
        ...(isOwner ? [{
            title: 'Location Code',
            key: 'location_type',
            render: (_, record) => (
                <Badge variant={record.location_type === 'Warehouse' ? 'primary' : 'warning'}>
                    {record.location_code}
                </Badge>
            )
        }] : []),

        ...(isOwner ? [{
            title: 'Location',
            key: 'location_name',
            render: (val) => (<span>{val}</span>)
        }] : []),

        {
            title: 'Quantity',
            key: 'quantity',
            render: (value, record) => (
                <Badge variant={value <= record.min_stock ? 'danger' : 'success'} className="badge-status">
                    {value}
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
                            <button className="action-item" onClick={() => {
                                const rolePath = user?.role_name === 'Store Owner' ? '/owner' :
                                    user?.role_name === 'Store Manager' ? '/manager' :
                                        user?.role_name === 'Cashier' ? '/cashier' :
                                            user?.role_name === 'Inventory Staff' ? '/inventory' : '/warehouse';
                                navigate(`${rolePath}/transactions?product_id=${record.product_id}`);
                                setActiveDropdown(null);
                            }}>
                                <Icons.View size={16} /> Transactions
                            </button>
                            {canManageStock && (
                                <button className="action-item" onClick={() => {
                                    handleOpenModal(record);
                                    setActiveDropdown(null);
                                }}>
                                    <Icons.Settings size={16} /> Manage
                                </button>
                            )}
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

    const totalStock = stock.reduce((acc, curr) => acc + curr.quantity, 0);
    const lowStockItems = stock.filter(s => s.quantity <= s.min_stock).length;

    return (
        <MainLayout>
            <div className="inventory-container">
                <header className="page-header">
                    <div>
                        <h1>Current Stock</h1>
                        <p>View and manage your inventory stock levels</p>
                    </div>
                    <div className="header-actions">
                        {canManageStock && (
                            <Button
                                variant="outline"
                                onClick={() => handleOpenModal(null)}
                            >
                                <Icons.Settings size={20} /> Manage Stock
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => {
                                const rolePath = user?.role_name === 'Store Owner' ? '/owner' :
                                    user?.role_name === 'Store Manager' ? '/manager' :
                                        user?.role_name === 'Cashier' ? '/cashier' :
                                            user?.role_name === 'Inventory Staff' ? '/inventory' : '/warehouse';
                                navigate(`${rolePath}/transactions`);
                            }}
                        >
                            <Icons.FileText size={20} /> View Transactions
                        </Button>
                    </div>
                </header>

                {/* <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-icon primary">
                            <Icons.Package size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>Total Stock Value (Items)</h3>
                            <p>{totalStock}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon warning">
                            <Icons.AlertTriangle size={24} />
                        </div>
                        <div className="stat-content">
                            <h3>Low Stock Items</h3>
                            <p>{lowStockItems}</p>
                        </div>
                    </div>
                </div> */}

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="inventory-table-card">
                    {stock.length > 0 ? (
                        <Table
                            columns={columns}
                            data={stock}
                            columnSearchable={true}
                            searchable={false}
                            className="common-table"
                            itemName="Stock Items"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Archive size={48} />}
                            title="No Stock Found"
                            description="There are currently no items in your stock inventory."
                        />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title="Manage Stock"
                    size="large"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSubmit}>Submit Transaction</Button>
                        </>
                    }
                >
                    <div className="common-form">
                        {selectedProduct ? (
                            <div className="selection-result-card">
                                <div className="entity-info">
                                    <div className="entity-icon">
                                        <Icons.Package size={24} />
                                    </div>
                                    <div className="entity-details">
                                        <span className="entity-name">{selectedProduct.product_name}</span>
                                        <div className="entity-sub">
                                            <Badge variant="primary" className="badge-code" style={{ fontSize: '10px' }}>{selectedProduct.sku}</Badge>
                                            <span style={{ color: 'var(--gray-400)' }}>•</span>
                                            <span style={{ fontWeight: 600, color: selectedStock ? 'var(--success-color)' : 'var(--warning-color)' }}>
                                                {selectedStock ? `${selectedStock.quantity} ${selectedProduct.unit || 'Units'} Available` : 'No Stock'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="entity-action" onClick={() => { setSelectedProduct(null); setSelectedStock(null); setProductSearch(''); setProductDropdownOpen(true); }} title="Change Product">
                                    <Icons.RefreshCw size={14} />
                                </div>
                            </div>
                        ) : (
                            <div className="form-card">
                                <div className="form-group custom-search-dropdown" style={{ position: 'relative', marginBottom: 0 }}>
                                    <Input
                                        label="Select Product to Manage"
                                        required
                                        type="text"
                                        placeholder="Search by name or SKU..."
                                        value={productSearch}
                                        onChange={(e) => {
                                            setProductSearch(e.target.value);
                                            setProductDropdownOpen(true);
                                            setSelectedProduct(null);
                                            setSelectedStock(null);
                                            setProductDropdownOpen(true);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setProductDropdownOpen(true);
                                        }}
                                        icon={<Icons.Search size={16} />}
                                    />

                                    {productDropdownOpen && (
                                        <div className="search-dropdown-menu">
                                            {activeProducts
                                                .filter(p => `${p.product_name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase()))
                                                .map(p => {
                                                    const existingStock = stock.find(s => s.product_id === p.id);
                                                    return (
                                                        <div
                                                            key={p.id}
                                                            className="search-dropdown-item"
                                                            onClick={() => {
                                                                setSelectedProduct(p);
                                                                setSelectedStock(existingStock || null);
                                                                setProductSearch(`${p.product_name} (SKU: ${p.sku})`);
                                                                setProductDropdownOpen(false);
                                                                const options = getMovementOptions();
                                                                setFormData(f => ({
                                                                    ...f,
                                                                    movement_type: existingStock ? options[0] : (options.includes('ADD') ? 'ADD' : options[0])
                                                                }));
                                                            }}
                                                        >
                                                            <div className="search-item-icon">
                                                                <Icons.Package size={20} />
                                                            </div>
                                                            <div className="search-item-content">
                                                                <span className="search-item-title">{p.product_name}</span>
                                                                <div className="search-item-sub">
                                                                    <span>SKU: {p.sku}</span>
                                                                    <span>•</span>
                                                                    <span>{p.category_name || 'General'}</span>
                                                                </div>
                                                            </div>
                                                            <div className="search-item-stock" style={{
                                                                color: existingStock ? 'var(--success-color)' : 'var(--warning-color)',
                                                                background: existingStock ? 'var(--success-light)' : 'var(--warning-light)'
                                                            }}>
                                                                {existingStock ? `Stock: ${existingStock.quantity}` : 'No Stock'}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            {activeProducts.filter(p => `${p.product_name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-500)' }}>
                                                    No products found matching "{productSearch}"
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="form-card">
                            <div className="form-section-title" style={{ marginTop: 0 }}>
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
                                    onWheel={(e) => e.target.blur()}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    error={formErrors.quantity}
                                    required
                                />
                            </div>

                            {formData.movement_type === 'EXCHANGE' && (
                                <div className="form-group" style={{ position: 'relative', marginTop: '16px' }}>
                                    {selectedExchangeProduct ? (
                                        <div className="selection-result-card" style={{ borderStyle: 'dashed', borderColor: 'var(--warning-color)', background: 'var(--warning-light)' }}>
                                            <div className="entity-info">
                                                <div className="entity-icon" style={{ background: 'var(--white)', color: 'var(--warning-color)' }}>
                                                    <Icons.Package size={20} />
                                                </div>
                                                <div className="entity-details">
                                                    <span className="entity-name">{selectedExchangeProduct.product_name}</span>
                                                    <span className="entity-sub">
                                                        <Badge variant="warning" className="badge-code" style={{ fontSize: '10px' }}>{selectedExchangeProduct.sku}</Badge>
                                                        <span>• Target Exchange Product</span>
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="entity-action" onClick={() => { setSelectedExchangeProduct(null); setExchangeProductSearch(''); setExchangeProductDropdownOpen(true); }} title="Change Product">
                                                <Icons.RefreshCw size={14} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="custom-search-dropdown" style={{ position: 'relative' }}>
                                            <Input
                                                label="Select New Product (to Exchange with)"
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
                                                    setExchangeProductDropdownOpen(true);
                                                }}
                                                error={formErrors.exchange_product}
                                                icon={<Icons.Search size={16} />}
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
                                                                <div className="search-item-icon">
                                                                    <Icons.Package size={20} />
                                                                </div>
                                                                <div className="search-item-content">
                                                                    <span className="search-item-title">{p.product_name}</span>
                                                                    <div className="search-item-sub">SKU: {p.sku}</div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.movement_type === 'TRANSFER' && (
                                <div className="form-group" style={{ position: 'relative', marginTop: '16px' }}>
                                    {formData.destination_location_id ? (
                                        <div className="selection-result-card" style={{ borderStyle: 'dashed', borderColor: 'var(--primary-color)' }}>
                                            <div className="entity-info">
                                                <div className="entity-icon" style={{ background: 'var(--white)' }}>
                                                    {formData.destination_location_type === 'Store' ? <Icons.Store size={24} /> : <Icons.Warehouse size={24} />}
                                                </div>
                                                <div className="entity-details">
                                                    <span className="entity-name">
                                                        {activeLocations.find(l => l.id === formData.destination_location_id && l.type === formData.destination_location_type)?.name}
                                                    </span>
                                                    <div className="entity-sub">
                                                        <Badge variant="primary" className="badge-code" style={{ fontSize: '10px' }}>
                                                            {activeLocations.find(l => l.id === formData.destination_location_id && l.type === formData.destination_location_type)?.code}
                                                        </Badge>
                                                        <span style={{ color: 'var(--gray-400)' }}>•</span>
                                                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{formData.destination_location_type} Destination</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="entity-action" onClick={() => { setFormData({ ...formData, destination_location_id: null, destination_location_type: '' }); setDestinationSearch(''); setDestinationDropdownOpen(true); }} title="Change Location">
                                                <Icons.RefreshCw size={14} />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="custom-search-dropdown" style={{ position: 'relative' }}>
                                            <Input
                                                label="Destination Location"
                                                required
                                                type="text"
                                                placeholder="Search destination..."
                                                value={destinationSearch}
                                                onChange={(e) => {
                                                    setDestinationSearch(e.target.value);
                                                    setDestinationDropdownOpen(true);
                                                    setFormData({ ...formData, destination_location_id: null, destination_location_type: '' });
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDestinationDropdownOpen(!destinationDropdownOpen);
                                                }}
                                                icon={<Icons.Search size={16} />}
                                            />

                                            {destinationDropdownOpen && (
                                                <div className="search-dropdown-menu" style={{ top: '100%', marginTop: '4px' }}>
                                                    {activeLocations
                                                        .filter(l => !(l.type === selectedStock?.location_type && l.id === selectedStock?.location_id))
                                                        .filter(l => `${l.name} ${l.type} ${l.code}`.toLowerCase().includes(destinationSearch.toLowerCase()))
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
                                                                    setDestinationSearch(`${l.name} (${l.type})`);
                                                                    setDestinationDropdownOpen(false);
                                                                }}
                                                            >
                                                                <div className="search-item-icon">
                                                                    {l.type === 'Store' ? <Icons.Store size={20} /> : <Icons.Warehouse size={20} />}
                                                                </div>
                                                                <div className="search-item-content">
                                                                    <span className="search-item-title">{l.name}</span>
                                                                    <div className="search-item-sub">
                                                                        <span>{l.type}</span>
                                                                        <span>•</span>
                                                                        <span>{l.code || `#${l.id}`}</span>
                                                                    </div>
                                                                </div>
                                                                <div className="search-item-stock" style={{ background: 'var(--primary-light)', color: 'var(--primary-color)' }}>
                                                                    Select
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

                            <div className="form-section-title">
                                <span className="icon"><Icons.FileText size={14} /></span>
                                Additional Information
                            </div>

                            <div className="common-form-grid" style={{ gap: '16px' }}>
                                <Input
                                    type="text"
                                    label="Reference / Invoice"
                                    value={formData.reference_id || ''}
                                    onChange={(e) => setFormData({ ...formData, reference_id: e.target.value })}
                                    error={formErrors.reference_id}
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

export default StockList;
