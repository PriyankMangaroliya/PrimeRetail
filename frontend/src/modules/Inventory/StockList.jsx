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
import './Inventory.css';

const StockList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const isOwner = user?.role_name === 'Store Owner';
    const isManager = user?.role_name === 'Store Manager';
    const isCashier = user?.role_name === 'Cashier';
    const isInventory = user?.role_name === 'Inventory Staff';
    const isWarehouse = user?.role_name === 'Warehouse Staff';

    const canManageStock = isInventory || isWarehouse || isCashier;

    const getMovementOptions = () => {
        if (isWarehouse) return ['Add', 'Transfer', 'Damaged', 'By Mistake Add'];
        if (isInventory) return ['Transfer', 'Damaged', 'Return', 'Exchange'];
        if (isCashier) return ['Sell'];
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
    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    const [formData, setFormData] = useState({
        movement_type: '',
        quantity: '',
        notes: '',
        destination_location_type: '',
        destination_location_id: ''
    });

    const [formErrors, setFormErrors] = useState({});
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [destinationDropdownOpen, setDestinationDropdownOpen] = useState(false);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.common-action-menu')) {
                setActiveDropdown(null);
            }
            if (!e.target.closest('.custom-search-dropdown')) {
                setProductDropdownOpen(false);
                setDestinationDropdownOpen(false);
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
                    setActiveProducts((prodRes.data || []).filter(p => p.is_active !== false));
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
            movement_type: stockItem ? (options[0] || 'Others') : 'Add',
            quantity: '',
            notes: '',
            destination_location_type: '',
            destination_location_id: ''
        });
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
        if (selectedStock && formData.movement_type !== 'Add' && parseInt(formData.quantity) > selectedStock.quantity) {
            errors.quantity = `Insufficient stock. Current: ${selectedStock.quantity}`;
        }
        if (formData.movement_type === 'Transfer' && (!formData.destination_location_id)) {
            errors.destination = 'Please select a destination location';
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
            if (formData.movement_type === 'Add') {
                await inventoryApi.createStock({
                    product_id: selectedProduct.id,
                    quantity: parseInt(formData.quantity),
                    notes: formData.notes,
                    movement_type: 'Add'
                });
                showAlert('success', 'Stock added/refilled successfully');
            } else {
                const payload = {
                    product_id: selectedProduct.id,
                    stock_id: selectedStock.id,
                    movement_type: formData.movement_type,
                    quantity: parseInt(formData.quantity),
                    notes: `[${formData.movement_type}] ` + formData.notes,
                    source_location_type: selectedStock.location_type,
                    source_location_id: selectedStock.location_id,
                };

                if (formData.movement_type === 'Transfer') {
                    payload.destination_location_type = formData.destination_location_type;
                    payload.destination_location_id = formData.destination_location_id;
                }

                await inventoryApi.createTransaction(payload);
                showAlert('success', 'Stock adjustment/transfer recorded successfully');
            }
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
        ...(!(isWarehouse || isInventory || isCashier) ? [{
            title: 'Location Code',
            key: 'location_type',
            render: (_, record) => (
                <Badge variant={record.location_type === 'Warehouse' ? 'primary' : 'warning'}>
                    {record.location_code}
                </Badge>
            )
        }] : []),

        ...(!(isWarehouse || isInventory || isCashier) ? [{
            title: 'Location',
            key: 'location_name',
            render: (val) => (<span>{val}</span>)
        }] : []),

        {
            title: 'Quantity',
            key: 'quantity',
            render: (val, record) => (
                <span className={val <= record.min_stock ? 'text-danger fw-bold' : ''}>
                    {val} {val <= record.min_stock && <Icons.AlertTriangle size={14} className="ms-1" color="var(--danger-color)" />}
                </span>
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
                <div className="inventory-loading">
                    <Loader size="large" />
                    <p>Loading stock inventory...</p>
                </div>
            </MainLayout>
        );
    }

    const totalStock = stock.reduce((acc, curr) => acc + curr.quantity, 0);
    const lowStockItems = stock.filter(s => s.quantity <= s.min_stock).length;

    return (
        <MainLayout>
            <div className="inventory-container">
                <header className="inventory-header">
                    <div className="header-info">
                        <h1>Current Stock</h1>
                        <p>View and manage your inventory stock levels</p>
                    </div>
                    <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
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

                <div className="inventory-stats">
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
                </div>

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
                            className="inventory-table"
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
                    size="md"
                    footer={
                        <>
                            <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                            <Button variant="primary" onClick={handleSubmit}>Submit Transaction</Button>
                        </>
                    }
                >
                    <form onSubmit={handleSubmit} className="transaction-form">
                        <div className="form-group custom-search-dropdown" style={{ position: 'relative', marginBottom: '1rem' }}>
                            <Input
                                label="Select Product"
                                required
                                type="text"
                                placeholder="Search by name or SKU..."
                                value={productSearch}
                                onChange={(e) => {
                                    setProductSearch(e.target.value);
                                    setProductDropdownOpen(true);
                                    setSelectedProduct(null); // Reset when user types
                                    setSelectedStock(null);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setProductDropdownOpen(!productDropdownOpen);
                                    setDestinationDropdownOpen(false);
                                }}
                                icon={<span>▼</span>}
                            />

                            {productDropdownOpen && (
                                <div
                                    style={{
                                        position: 'absolute', top: '100%', left: 0, right: 0,
                                        background: 'white', border: '1px solid #e5e7eb',
                                        borderRadius: '6px', maxHeight: '250px', overflowY: 'auto',
                                        zIndex: 500, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                        marginTop: '4px'
                                    }}
                                >
                                    {activeProducts
                                        .filter(p => `${p.product_name} ${p.sku}`.toLowerCase().includes(productSearch.toLowerCase()))
                                        .map(p => (
                                            <div
                                                key={p.id}
                                                style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                onClick={() => {
                                                    const existingStock = stock.find(s => s.product_id === p.id);
                                                    setSelectedProduct(p);
                                                    setSelectedStock(existingStock || null);
                                                    setProductSearch(`${p.product_name} (SKU: ${p.sku})`);
                                                    setProductDropdownOpen(false);

                                                    // Auto-set movement type
                                                    if (existingStock) {
                                                        const options = getMovementOptions();
                                                        setFormData(f => ({ ...f, movement_type: options[0] || 'Others' }));
                                                    } else {
                                                        setFormData(f => ({ ...f, movement_type: 'Add' }));
                                                    }
                                                }}
                                            >
                                                <div style={{ fontWeight: 500, color: '#1f2937' }}>{p.product_name}</div>
                                                <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                    SKU: {p.sku} {stock.find(s => s.product_id === p.id) ? `| Current Stock: ${stock.find(s => s.product_id === p.id).quantity}` : '| No Stock'}
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            )}

                            {selectedProduct && (
                                <div className="mt-2 flex items-center gap-2">
                                    {selectedStock ? (
                                        <Badge variant="success">Current Stock: {selectedStock.quantity}</Badge>
                                    ) : (
                                        <Badge variant="warning">Product not in stock</Badge>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="form-row">
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

                        <Input
                            type="text"
                            label="Notes / Reason"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />

                        {formData.movement_type === 'Transfer' && (
                            <div className="form-group custom-search-dropdown" style={{ position: 'relative', marginTop: '1rem', marginBottom: '1rem' }}>
                                <label className="input-label">Destination Location <span className="required">*</span></label>
                                <div
                                    className="input-field"
                                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', background: '#fff', padding: '0 12px' }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setDestinationDropdownOpen(!destinationDropdownOpen);
                                        setProductDropdownOpen(false);
                                    }}
                                >
                                    <div style={{ flex: 1, padding: '8px 0' }}>
                                        {formData.destination_location_id ?
                                            activeLocations.find(l => l.id === formData.destination_location_id && l.type === formData.destination_location_type)?.name :
                                            'Select Destination...'}
                                    </div>
                                    <span style={{ color: '#6b7280', fontSize: '10px' }}>▼</span>
                                </div>

                                {destinationDropdownOpen && (
                                    <div
                                        style={{
                                            position: 'absolute', top: '100%', left: 0, right: 0,
                                            background: 'white', border: '1px solid #e5e7eb',
                                            borderRadius: '6px', maxHeight: '200px', overflowY: 'auto',
                                            zIndex: 510, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                                            marginTop: '4px'
                                        }}
                                    >
                                        {activeLocations
                                            .filter(l => !(l.type === selectedStock?.location_type && l.id === selectedStock?.location_id)) // Exclude current location
                                            .map(l => (
                                                <div
                                                    key={`${l.type}-${l.id}`}
                                                    style={{ padding: '10px 12px', cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
                                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    onClick={() => {
                                                        setFormData({
                                                            ...formData,
                                                            destination_location_type: l.type,
                                                            destination_location_id: l.id
                                                        });
                                                        setDestinationDropdownOpen(false);
                                                    }}
                                                >
                                                    <div style={{ fontWeight: 500, color: '#1f2937' }}>{l.name}</div>
                                                    <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                                        {l.type} - {l.code || `#${l.id}`}
                                                    </div>
                                                </div>
                                            ))}
                                    </div>
                                )}
                                {formErrors.destination && <p className="error-message" style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>{formErrors.destination}</p>}
                            </div>
                        )}
                    </form>
                </Modal>
            </div>
        </MainLayout>
    );
};

export default StockList;
