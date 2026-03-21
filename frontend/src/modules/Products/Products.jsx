import React, { useState, useEffect } from 'react';
import Icons from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import productApi from '../../api/product.api';
import categoryApi from '../../api/category.api';
import storeTaxApi from '../../api/storeTax.api';
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
import './Products.css';

const Products = () => {
    const { user } = useAuth();
    const isOwner = user?.role_name === 'Store Owner';
    const isSuperAdmin = user?.role_name === 'Super Admin';

    // Data states
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [storeTaxes, setStoreTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete', 'view'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState({
        product_name: '',
        sku: '',
        barcode: '',
        category_id: '',
        tax_id: '',
        price: '',
        unit: 'Pcs',
        min_stock: '0',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isSuperAdmin) {
            fetchData();
        }
    }, [isSuperAdmin]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [prodRes, catRes, taxRes] = await Promise.all([
                productApi.getAllProducts(),
                categoryApi.getActiveCategories(),
                isOwner ? storeTaxApi.getStoreTaxes() : Promise.resolve({ data: [] })
            ]);
            setProducts(prodRes.data || []);
            setCategories(catRes.data || []);
            setStoreTaxes(taxRes.data || []);
        } catch (error) {
            showAlert('danger', error.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const resetForm = () => ({
        product_name: '',
        sku: '',
        barcode: '',
        category_id: '',
        tax_id: '',
        price: '',
        unit: 'Pcs',
        min_stock: '0',
        description: ''
    });

    const handleOpenModal = (type, product = null) => {
        setModalType(type);
        setSelectedProduct(product);
        if (product) {
            setFormData({
                product_name: product.product_name || '',
                sku: product.sku || '',
                barcode: product.barcode || '',
                category_id: product.category_id || '',
                tax_id: product.tax_id || '',
                price: product.price || '',
                unit: product.unit || 'Pcs',
                min_stock: product.min_stock || '0',
                description: product.description || ''
            });
        } else {
            setFormData(resetForm());
        }
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.product_name.trim()) errors.product_name = 'Product name is required';
        if (!formData.category_id) errors.category_id = 'Category is required';
        if (!formData.tax_id) errors.tax_id = 'Tax is required';
        if (!formData.price || isNaN(formData.price)) errors.price = 'Valid price is required';
        if (!formData.unit.trim()) errors.unit = 'Unit is required';
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                min_stock: parseInt(formData.min_stock || 0)
            };

            if (modalType === 'add') {
                await productApi.createProduct(payload);
                showAlert('success', 'Product created successfully');
            } else {
                await productApi.updateProduct(selectedProduct.id, payload);
                showAlert('success', 'Product updated successfully');
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            showAlert('danger', error.message || `Failed to ${modalType} product`);
        }
    };

    const handleDelete = async () => {
        try {
            await productApi.deleteProduct(selectedProduct.id);
            showAlert('success', 'Product deleted successfully');
            setShowModal(false);
            fetchData();
        } catch (error) {
            showAlert('danger', error.message || 'Failed to delete product');
        }
    };

    const handleToggleStatus = async (product) => {
        try {
            await productApi.toggleProductStatus(product.id);
            showAlert('success', `Product ${product.is_active ? 'deactivated' : 'activated'} successfully`);
            fetchData();
        } catch (error) {
            showAlert('danger', error.message || 'Failed to update status');
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
            title: 'Product Name',
            key: 'product_name',
            className: 'table-name-cell'
        },
        {
            title: 'Category',
            key: 'category_name'
        },
        {
            title: 'Price',
            key: 'price',
            render: (value) => `₹${parseFloat(value).toFixed(2)}`
        },
        {
            title: 'Unit',
            key: 'unit'
        },
        {
            title: 'Stock',
            key: 'stock_quantity',
            render: (value, record) => (
                <div className="flex items-center gap-2">
                    <span className={value <= record.min_stock ? 'text-danger fw-bold' : ''}>
                        {value} {record.unit}
                    </span>
                    {value <= record.min_stock && <Icons.AlertTriangle size={14} color="var(--danger-color)" />}
                </div>
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
                                <Icons.View size={16}/> View
                            </button>
                            {isOwner && (
                                <>
                                    <button className="action-item" onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                        {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                                    </button>
                                    <button className="action-item" onClick={() => {
                                        handleOpenModal('edit', record);
                                        setActiveDropdown(null);
                                    }}>
                                        <Icons.Edit size={16}/> Edit
                                    </button>
                                    <button
                                        className="action-item delete-item"
                                        onClick={() => {
                                            handleOpenModal('delete', record);
                                            setActiveDropdown(null);
                                        }}
                                    >
                                        <Icons.Delete size={16}/> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )
        }
    ];

    const stockColumns = [
        {
            title: 'Store Name',
            key: 'store_name',
            render: (val, record) => val || `Store #${record.store_id}`
        },
        {
            title: 'Location',
            key: 'location',
            render: (val) => val || 'N/A'
        },
        {
            title: 'Stock Quantity',
            key: 'quantity',
            render: (val) => (
                <Badge variant={val > 0 ? 'success' : 'danger'}>
                    {val} {selectedProduct?.unit}
                </Badge>
            )
        }
    ];

    if (isSuperAdmin) {
        return (
            <MainLayout>
                <div className="products-container">
                    <EmptyState
                        icon={<Icons.Lock size={48} />}
                        title="Access Denied"
                        description="Super Admins do not have access to this module."
                    />
                </div>
            </MainLayout>
        );
    }

    if (loading) {
        return (
            <MainLayout>
                <div className="cat-loading">
                    <Loader size="large"/>
                    <p>Loading products...</p>
                </div>
            </MainLayout>
        );
    }

    const handleProductNameChange = (name) => {
        const slug = name
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, '_')
            .substring(0, 50);

        setFormData(prev => {
            const updates = { product_name: name };
            
            // Auto-generate SKU if it was empty or matches the slug of the old name
            const oldSlug = prev.product_name.toUpperCase().replace(/[^A-Z0-9]/g, '_').substring(0, 50);
            if (!prev.sku || prev.sku === oldSlug) {
                updates.sku = slug;
            }

            // Auto-generate Barcode if it matches the SKU or the slug of the old name
            if (!prev.barcode || prev.barcode === prev.sku || prev.barcode === oldSlug) {
                updates.barcode = slug;
            }

            return { ...prev, ...updates };
        });
    };

    return (
        <MainLayout>
            <div className="category-container">
                <header className="category-header">
                    <div className="header-info">
                        <h1>Products</h1>
                        <p>Manage your product catalog and inventory</p>
                    </div>
                    {isOwner && (
                        <div className="header-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleOpenModal('add')}
                            >
                                <Icons.Plus size={20}/> Add Product
                            </Button>
                        </div>
                    )}
                </header>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="category-table-card">
                    {products.length > 0 ? (
                        <Table
                            columns={columns}
                            data={products}
                            className="products-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Products"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Product size={48}/>}
                            title="No Products Found"
                            description="You haven't added any products yet. Add your first product to get started."
                            action={
                                isOwner ? (
                                    <Button onClick={() => handleOpenModal('add')}>
                                        Add Product
                                    </Button>
                                ) : null
                            }
                        />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                    title={
                        modalType === 'add' ? 'Add New Product' :
                            modalType === 'edit' ? 'Edit Product' :
                                modalType === 'view' ? 'Product Details' :
                                    'Delete Product'
                    }
                    size={(modalType === 'add' || modalType === 'edit' || modalType === 'view') ? 'large' : 'md'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="danger" onClick={handleDelete}>Delete Product</Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="primary" onClick={() => setShowModal(false)}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Add Product' : 'Save Changes'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)"/></div>
                            <p>Are you sure you want to delete
                                product <strong>{selectedProduct?.product_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone and will fail if transactions exist.</p>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="category-view">
                            <div className="cat-details-view">
                                <div className="cat-brand-icon">
                                    <span className="cat-icon-large"><Icons.Product size={40}/></span>
                                </div>
                                <div className="cat-info-text">
                                    <h3>{selectedProduct?.product_name}</h3>
                                    <Badge variant="primary">{selectedProduct?.sku}</Badge>
                                </div>
                            </div>

                            <div className="view-grid">
                                <div className="view-group">
                                    <label>Barcode</label>
                                    <p>{selectedProduct?.barcode || 'N/A'}</p>
                                </div>
                                <div className="view-group">
                                    <label>Category</label>
                                    <p>{selectedProduct?.category_name}</p>
                                </div>
                                <div className="view-group">
                                    <label>Price</label>
                                    <p>₹{parseFloat(selectedProduct?.price).toFixed(2)}</p>
                                </div>
                                <div className="view-group">
                                    <label>Unit</label>
                                    <p>{selectedProduct?.unit}</p>
                                </div>
                                <div className="view-group">
                                    <label>Min Stock Threshold</label>
                                    <p>{selectedProduct?.min_stock} {selectedProduct?.unit}</p>
                                </div>
                                <div className="view-group">
                                    <label>Tax</label>
                                    <p>{selectedProduct?.tax_name} ({selectedProduct?.tax_rate}%)</p>
                                </div>
                                <div className="view-group">
                                    <label>Status</label>
                                    <p>
                                        <Badge variant={selectedProduct?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedProduct?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="view-group" style={{gridColumn: 'span 2'}}>
                                    <label>Description</label>
                                    <p>{selectedProduct?.description || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Store-wise Stock table */}
                            <div className="view-products-list">
                                <h4>Store-wise Stock</h4>
                                    <div className="products-scroll">
                                        <Table
                                            columns={stockColumns}
                                            data={selectedProduct?.stock_by_store || []}
                                            searchable={false}
                                            itemsPerPage={5}
                                        />
                                    </div>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="category-form">
                            <div className="form-row">
                                <Input
                                    label="Product Name"
                                    value={formData.product_name}
                                    onChange={(e) => handleProductNameChange(e.target.value)}
                                    error={formErrors.product_name}
                                    required
                                />
                                <Input
                                    label="SKU"
                                    value={formData.sku}
                                    onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                    placeholder="e.g. ELECTRONICS_01"
                                />
                            </div>
                            <div className="form-row">
                                <Input
                                    label="Barcode"
                                    value={formData.barcode}
                                    onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                />
                                <Select
                                    label="Category"
                                    required
                                    value={formData.category_id}
                                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                                    error={formErrors.category_id}
                                    options={[
                                        { value: '', label: 'Select Category' },
                                        ...categories.map(c => ({ value: c.id, label: c.category_name }))
                                    ]}
                                />
                            </div>
                            <div className="form-row">
                                <Select
                                    label="Tax Rule"
                                    required
                                    value={formData.tax_id}
                                    onChange={(e) => setFormData({...formData, tax_id: e.target.value})}
                                    error={formErrors.tax_id}
                                    options={[
                                        { value: '', label: 'Select Tax' },
                                        ...storeTaxes.filter(t => t.is_active).map(t => ({ value: t.id, label: `${t.tax_name} (${t.tax_rate}%)` }))
                                    ]}
                                />
                                <Input
                                    label="Price (₹)"
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                                    error={formErrors.price}
                                    required
                                />
                            </div>
                            <div className="form-row">
                                <Input
                                    label="Unit"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                                    error={formErrors.unit}
                                    required
                                />
                                <Input
                                    label="Min Stock Alert Level"
                                    type="number"
                                    min="0"
                                    value={formData.min_stock}
                                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})}
                                    placeholder="e.g. 10"
                                />
                            </div>
                            <Input
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                            />
                        </form>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Products;
