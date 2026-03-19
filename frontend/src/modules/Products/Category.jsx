import React, {useState, useEffect} from 'react';
import Icons, {FiIcons} from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import {useAuth} from '../../context/AuthContext';
import categoryApi from '../../api/category.api';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import TextArea from '../../components/common/TextArea/TextArea';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import './Category.css';

const Category = () => {
    const {user} = useAuth();
    const isOwner = user?.role_name === 'Store Owner';

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'delete', 'view'
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [formData, setFormData] = useState({
        category_name: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({show: false, type: '', message: ''});
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await categoryApi.getAllCategories();
            setCategories(res.data || []);
        } catch (error) {
            showAlert('danger', error.message || 'Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({show: true, type, message});
        setTimeout(() => setAlert({show: false, type: '', message: ''}), 5000);
    };

    const resetForm = () => ({
        category_name: '',
        description: ''
    });

    const handleOpenModal = (type, category = null) => {
        setModalType(type);
        setSelectedCategory(category);
        setFormData(category ? {
            category_name: category.category_name || '',
            description: category.description || ''
        } : resetForm());
        setFormErrors({});
        setShowModal(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.category_name.trim()) errors.category_name = 'Category name is required';
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
                category_name: formData.category_name.trim(),
                description: formData.description?.trim() || null
            };

            if (modalType === 'add') {
                await categoryApi.createCategory(payload);
                showAlert('success', 'Category created successfully');
            } else {
                await categoryApi.updateCategory(selectedCategory.id, payload);
                showAlert('success', 'Category updated successfully');
            }
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            showAlert('danger', error.message || `Failed to ${modalType} category`);
        }
    };

    const handleDelete = async () => {
        try {
            await categoryApi.deleteCategory(selectedCategory.id);
            showAlert('success', 'Category deleted successfully');
            setShowModal(false);
            fetchCategories();
        } catch (error) {
            showAlert('danger', error.message || 'Failed to delete category');
        }
    };

    const handleToggleStatus = async (category) => {
        try {
            await categoryApi.toggleCategoryStatus(category.id);
            showAlert('success', `Category ${category.is_active ? 'deactivated' : 'activated'} successfully`);
            fetchCategories();
        } catch (error) {
            showAlert('danger', error.message || 'Failed to update status');
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'id',
            render: (_, __, index) => <span className="cat-row-no">{index + 1}</span>
        },
        {
            title: 'Category Name',
            key: 'category_name',
            render: (value) => <span className="cat-name">{value}</span>
        },
        {
            title: 'Products',
            key: 'product_count',
            render: (value) => (
                <Badge variant="primary">
                    {value || 0} Products
                </Badge>
            )
        },
        {
            title: 'Status',
            key: 'is_active',
            render: (value) => (
                <Badge variant={value ? 'success' : 'danger'} className="status-badge">
                    {value ? 'Active' : 'Inactive'}
                </Badge>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="action-menu-container" onClick={(e) => e.stopPropagation()}>
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
                            <button onClick={() => { handleOpenModal('view', record); setActiveDropdown(null); }}>
                                <Icons.View size={16}/> View
                            </button>
                            {isOwner && (
                                <>
                                    <button onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                        {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                                    </button>
                                    <button onClick={() => {
                                        handleOpenModal('edit', record);
                                        setActiveDropdown(null);
                                    }}>
                                        <Icons.Edit size={16}/> Edit
                                    </button>
                                    <button
                                        className="delete-action-btn"
                                        onClick={() => {
                                            handleOpenModal('delete', record);
                                            setActiveDropdown(null);
                                        }}
                                        disabled={record.product_count > 0}
                                        title={record.product_count > 0 ? "Cannot delete category with products" : ""}
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

    if (loading) {
        return (
            <MainLayout>
                <div className="cat-loading">
                    <Loader size="large"/>
                    <p>Loading categories...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="category-container">
                <header className="category-header">
                    <div className="header-info">
                        <h1>Categories</h1>
                        <p>Manage product categories and groupings</p>
                    </div>
                    {isOwner && (
                        <div className="header-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleOpenModal('add')}
                            >
                                <Icons.Plus size={20}/> Add Category
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
                    {categories.length > 0 ? (
                        <Table
                            columns={columns}
                            data={categories}
                            columnSearchable={true}
                            searchable={false}
                            className="category-table"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Archive size={48}/>}
                            title="No Categories Found"
                            description="You haven't created any categories yet. Create your first category to organize your products."
                            action={
                                isOwner ? (
                                    <Button onClick={() => handleOpenModal('add')}>
                                        Create Category
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
                        modalType === 'add' ? 'Add New Category' :
                            modalType === 'edit' ? 'Edit Category' :
                                modalType === 'view' ? 'Category Details' :
                                    'Delete Category'
                    }
                    size={modalType === 'view' ? 'medium' : 'md'}
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="danger" onClick={handleDelete}>Delete Category</Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="primary" onClick={() => setShowModal(false)}>Close</Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Category' : 'Save Changes'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)"/></div>
                            <p>Are you sure you want to delete
                                category <strong>{selectedCategory?.category_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="category-view">
                            <div className="cat-details-view">
                                <div className="cat-brand-icon">
                                    <span className="cat-icon-large"><Icons.Layers size={40}/></span>
                                </div>
                                <div className="cat-info-text">
                                    <h3>{selectedCategory?.category_name}</h3>
                                    <p>
                                        <Badge variant="primary">{selectedCategory?.product_count || 0} Products</Badge>
                                    </p>
                                </div>
                            </div>

                            <div className="view-grid">
                                <div className="view-group">
                                    <label>Status</label>
                                    <p>
                                        <Badge variant={selectedCategory?.is_active ? 'success' : 'danger'}>
                                            {selectedCategory?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </p>
                                </div>
                                <div className="view-group" style={{gridColumn: 'span 2'}}>
                                    <label>Description</label>
                                    <p>{selectedCategory?.description || 'N/A'}</p>
                                </div>
                                <div className="view-group">
                                    <label>Created</label>
                                    <p>
                                        <small>
                                            {selectedCategory?.created_at
                                                ? new Date(selectedCategory.created_at).toLocaleString()
                                                : 'N/A'}
                                            {selectedCategory?.created_by_name ? ` by ${selectedCategory.created_by_name}` : ''}
                                        </small>
                                    </p>
                                </div>
                                <div className="view-group">
                                    <label>Last Updated</label>
                                    <p>
                                        <small>
                                            {selectedCategory?.updated_at
                                                ? new Date(selectedCategory.updated_at).toLocaleString()
                                                : 'N/A'}
                                            {selectedCategory?.updated_by_name ? ` by ${selectedCategory.updated_by_name}` : ''}
                                        </small>
                                    </p>
                                </div>
                            </div>

                            {selectedCategory?.products?.length > 0 && (
                                <div className="view-products-list">
                                    <h4>Linked Products</h4>
                                    <div className="products-scroll">
                                        <table className="mini-table">
                                            <thead>
                                            <tr>
                                                <th>Product Name</th>
                                                <th>SKU</th>
                                                <th>Price</th>
                                                <th>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {selectedCategory.products.map(product => (
                                                <tr key={product.id}>
                                                    <td>{product.product_name}</td>
                                                    <td><code>{product.sku}</code></td>
                                                    <td>₹{product.price}</td>
                                                    <td>
                                                        <Badge variant={product.is_active ? 'success' : 'danger'}
                                                               size="sm">
                                                            {product.is_active ? 'Active' : 'Inactive'}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            handleSubmit(e);
                        }} className="category-form">
                            <Input
                                label="Category Name"
                                value={formData.category_name}
                                onChange={(e) => setFormData({...formData, category_name: e.target.value})}
                                error={formErrors.category_name}
                                required
                                placeholder="e.g., Electronics, Beverages"
                            />

                            <TextArea
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                error={formErrors.description}
                                placeholder="Describe the category..."
                                rows="4"
                            />
                        </form>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Category;
