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
import productApi from '../../api/product.api';
import categoryApi from '../../api/category.api';
import Icons from '../../components/common/Icons';
import './Products.css';

const Products = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Data states
    const [products, setProducts] = useState([]);
    const [activeCategories, setActiveCategories] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('product-add'); // 'product-add' | 'product-edit' | 'product-view' | 'product-delete'
    const [selectedItem, setSelectedItem] = useState(null);

    // Form states
    const [productForm, setProductForm] = useState({
        product_name: '',
        sku: '',
        barcode: '',
        category_id: '',
        unit: 'Pcs',
        selling_price: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});

    const isStoreOwner = user?.role_name === 'Store Owner';

    // ── Pre-fetch / Effects ───────────────────────────────────────────────────

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (isStoreOwner) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [isStoreOwner]);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [prodRes, activeCatRes] = await Promise.all([
                productApi.getAllProducts(),
                categoryApi.getActiveCategories()
            ]);
            setProducts(prodRes.data || []);
            setActiveCategories(activeCatRes.data || []);
        } catch (err) {
            showAlert('error', err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    // ── Access check ──────────────────────────────────────────────────────────
    if (!isStoreOwner) {
        return (
            <MainLayout>
                <div className="products-container">
                    <div className="products-header">
                        <h1>Product Management</h1>
                    </div>
                    <Card className="products-table-card">
                        <EmptyState
                            icon={<Icons.Lock size={48} />}
                            title="Access Restricted"
                            description="Only Store Owners can access the Product Management module."
                        />
                    </Card>
                </div>
            </MainLayout>
        );
    }

    // ── Helper functions ──────────────────────────────────────────────────────
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setFormErrors({});
        setProductForm({
            product_name: '',
            sku: '',
            barcode: '',
            category_id: '',
            unit: 'Pcs',
            selling_price: '',
            description: ''
        });
    };

    // ── Product Actions ───────────────────────────────────────────────────────
    const handleProductSubmit = async () => {
        // Validation
        const errors = {};
        if (!productForm.product_name?.trim()) errors.product_name = 'Name is required';
        if (!productForm.sku?.trim()) errors.sku = 'SKU is required';
        if (!productForm.category_id) errors.category_id = 'Category is required';
        if (!productForm.selling_price || isNaN(productForm.selling_price)) errors.selling_price = 'Invalid price';

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        try {
            const payload = {
                ...productForm,
                selling_price: parseFloat(productForm.selling_price)
            };

            if (modalType === 'product-add') {
                await productApi.createProduct(payload);
                showAlert('success', 'Product created successfully');
            } else {
                await productApi.updateProduct(selectedItem.id, payload);
                showAlert('success', 'Product updated successfully');
            }
            fetchAllData();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleProductDelete = async () => {
        try {
            await productApi.deleteProduct(selectedItem.id);
            showAlert('success', 'Product deleted successfully');
            fetchAllData();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete product');
        }
    };

    const handleProductToggle = async (item) => {
        try {
            await productApi.toggleProductStatus(item.id);
            showAlert('success', `Product ${!item.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchAllData();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    // ── Table Definitions ─────────────────────────────────────────────────────
    const productColumns = [
        { title: 'No', key: 'id', render: (_, __, i) => i + 1 },
        { 
            title: 'SKU', 
            key: 'sku', 
            render: (v) => <Badge variant="dark" className="sku-badge">{v}</Badge> 
        },
        { title: 'Name', key: 'product_name', render: (v) => <span className="item-name">{v}</span> },
        { title: 'Category', key: 'category_name' },
        { 
            title: 'Price', 
            key: 'selling_price', 
            render: (v) => `₹${parseFloat(v).toFixed(2)}` 
        },
        { title: 'Unit', key: 'unit' },
        { 
            title: 'Status', 
            key: 'is_active', 
            render: (v) => (
                <Badge variant={v ? 'success' : 'danger'}>
                    {v ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="action-menu-container" onClick={e => e.stopPropagation()}>
                    <button className="action-menu-trigger" onClick={() => setActiveDropdown(activeDropdown === `p-${record.id}` ? null : `p-${record.id}`)}>⋮</button>
                    {activeDropdown === `p-${record.id}` && (
                        <div className="action-menu-dropdown">
                            <button onClick={() => { setModalType('product-view'); setSelectedItem(record); setShowModal(true); setActiveDropdown(null); }}>
                                <Icons.View size={16} /> View
                            </button>
                            <button onClick={() => { handleProductToggle(record); setActiveDropdown(null); }}>
                                {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                            </button>
                            <button onClick={() => { 
                                setModalType('product-edit'); 
                                setSelectedItem(record);
                                setProductForm({
                                    product_name: record.product_name,
                                    sku: record.sku,
                                    barcode: record.barcode || '',
                                    category_id: record.category_id,
                                    unit: record.unit,
                                    selling_price: record.selling_price,
                                    description: record.description || ''
                                });
                                setShowModal(true); 
                                setActiveDropdown(null); 
                            }}><Icons.Edit size={16} /> Edit</button>
                            <button className="delete-action-btn" onClick={() => { setModalType('product-delete'); setSelectedItem(record); setShowModal(true); setActiveDropdown(null); }}>
                                <Icons.Trash size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    // ── Main Render ──────────────────────────────────────────────────────────
    if (loading) {
        return (
            <MainLayout>
                <div className="products-loading">
                    <Loader size="large" />
                    <p>Loading products...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="products-container">
                {/* Header */}
                <div className="products-header">
                    <div>
                        <h1>Product Management</h1>
                        <p>Manage your product inventory</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => {
                            setModalType('product-add');
                            setShowModal(true);
                        }}>
                            <Icons.Plus size={18} /> Add Product
                        </Button>
                    </div>
                </div>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="products-table-card">
                    <div className="tab-content">
                        {products.length > 0 ? (
                            <Table columns={productColumns} data={products} columnSearchable={true} />
                        ) : (
                            <EmptyState icon={<Icons.Package size={48} />} title="No Products" description="Add your first product to get started." />
                        )}
                    </div>
                </Card>

                {/* Shared Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType.includes('add') ? 'Add Product' :
                        modalType.includes('edit') ? 'Edit Product' :
                        modalType.includes('view') ? 'Product Details' :
                        'Delete Product'
                    }
                    size={(modalType === 'product-add' || modalType === 'product-edit') ? 'large' : 'medium'}
                    footer={
                        modalType.includes('delete') ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="danger" onClick={handleProductDelete}>Delete</Button>
                            </>
                        ) : modalType.includes('view') ? (
                            <Button variant="primary" onClick={handleCloseModal}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="primary" onClick={handleProductSubmit}>
                                    {modalType.includes('add') ? 'Save' : 'Update'}
                                </Button>
                            </>
                        )
                    }
                >
                    {/* Delete Confirm */}
                    {modalType.includes('delete') && (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete <strong>{selectedItem.product_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>
                    )}

                    {/* Product View */}
                    {modalType === 'product-view' && (
                        <div className="item-view">
                            <div className="view-header">
                                <div className="view-icon"><Icons.Package size={48} /></div>
                                <div>
                                    <h3>{selectedItem.product_name}</h3>
                                    <Badge variant="dark">{selectedItem.sku}</Badge>
                                </div>
                            </div>
                            <div className="view-grid">
                                <div className="view-item"><label>Barcode</label><p>{selectedItem.barcode || 'N/A'}</p></div>
                                <div className="view-item"><label>Category</label><p>{selectedItem.category_name}</p></div>
                                <div className="view-item"><label>Price</label><p>₹{parseFloat(selectedItem.selling_price).toFixed(2)}</p></div>
                                <div className="view-item"><label>Unit</label><p>{selectedItem.unit}</p></div>
                                <div className="view-item"><label>Status</label><p><Badge variant={selectedItem.is_active ? 'success' : 'danger'}>{selectedItem.is_active ? 'Active' : 'Inactive'}</Badge></p></div>
                                <div className="view-item" style={{ gridColumn: 'span 2' }}><label>Description</label><p>{selectedItem.description || 'No description'}</p></div>
                            </div>
                        </div>
                    )}

                    {/* Product Form */}
                    {(modalType === 'product-add' || modalType === 'product-edit') && (
                        <div className="item-form">
                            <div className="form-row">
                                <Input label="Product Name" value={productForm.product_name} onChange={e => setProductForm({...productForm, product_name: e.target.value})} error={formErrors.product_name} required />
                                <Input label="SKU" value={productForm.sku} onChange={e => setProductForm({...productForm, sku: e.target.value})} error={formErrors.sku} required />
                            </div>
                            <div className="form-row">
                                <Input label="Barcode" value={productForm.barcode} onChange={e => setProductForm({...productForm, barcode: e.target.value})} />
                                <div className="form-field">
                                    <label>Category <span className="required-star">*</span></label>
                                    <select value={productForm.category_id} onChange={e => setProductForm({...productForm, category_id: e.target.value})}>
                                        <option value="">Select Category</option>
                                        {activeCategories.map(c => <option key={c.id} value={c.id}>{c.category_name}</option>)}
                                    </select>
                                    {formErrors.category_id && <span className="error-text">{formErrors.category_id}</span>}
                                </div>
                            </div>
                            <div className="form-row">
                                <Input label="Selling Price (₹)" type="number" value={productForm.selling_price} onChange={e => setProductForm({...productForm, selling_price: e.target.value})} error={formErrors.selling_price} required />
                                <Input label="Unit" value={productForm.unit} onChange={e => setProductForm({...productForm, unit: e.target.value})} placeholder="e.g., Pcs, Kg, Box" />
                            </div>
                            <TextArea label="Description" value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} rows={3} />
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Products;
