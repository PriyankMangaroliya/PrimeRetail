import React, { useState, useEffect } from 'react';
import Icons, { FiIcons } from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import categoryApi from '../../api/category.api';
import Table from '../../components/common/Table/Table';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';


const Category = () => {
    const { user } = useAuth();
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
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
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
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
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
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Category Name',
            key: 'category_name',
            className: 'table-name-cell'
        },
        {
            title: 'Products',
            key: 'product_count',
            render: (value) => (
                <Badge variant="primary" className="badge-count">
                    {value || 0} Products
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
                            {isOwner && (
                                <>
                                    <button className="action-item" onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                        {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                                    </button>
                                    <button className="action-item" onClick={() => {
                                        handleOpenModal('edit', record);
                                        setActiveDropdown(null);
                                    }}>
                                        <Icons.Edit size={16} /> Edit
                                    </button>
                                    <button
                                        className="action-item delete-item"
                                        onClick={() => {
                                            handleOpenModal('delete', record);
                                            setActiveDropdown(null);
                                        }}
                                        disabled={record.product_count > 0}
                                        title={record.product_count > 0 ? "Cannot delete category with products" : ""}
                                    >
                                        <Icons.Delete size={16} /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )
        }
    ];

    const linkColumns = [
        {
            title: 'Product Name',
            key: 'product_name',
            className: 'table-name-cell'
        },
        {
            title: 'SKU',
            key: 'sku',
            render: (val) => <code>{val}</code>
        },
        {
            title: 'Price',
            key: 'price',
            render: (val) => `₹${val}`
        },
        {
            title: 'Status',
            key: 'is_active',
            render: (val) => (
                <Badge variant={val ? 'success' : 'danger'} size="sm">
                    {val ? 'Active' : 'Inactive'}
                </Badge>
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
            <div className="category-container">
                <div className="page-header">
                    <div>
                        <h1>Categories</h1>
                        <p>Manage product categories and groupings</p>
                    </div>
                    {isOwner && (
                        <div className="header-actions">
                            <Button
                                variant="primary"
                                onClick={() => handleOpenModal('add')}
                            >
                                <Icons.Plus size={20} /> Add Category
                            </Button>
                        </div>
                    )}
                </div>

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
                            className="common-table"
                            itemName="Categories"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Archive size={48} />}
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
                            <Button variant="outline" onClick={() => setShowModal(false)}>Close</Button>
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
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete category <strong>{selectedCategory?.category_name}</strong>?</p>
                            <p className="sub-text mt-8">This action cannot be undone.</p>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    <Icons.Archive size={32} />
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedCategory?.category_name}</h2>
                                    <div className="detail-meta">
                                        <Badge variant={selectedCategory?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedCategory?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-header">Category Information</h4>
                                <div className="view-grid">
                                    <div className="view-group">
                                        <label>Product Count</label>
                                        <p>{selectedCategory?.product_count || 0} Items linked</p>
                                    </div>
                                    <div className="view-group full-width">
                                        <label>Category Description</label>
                                        <p>{selectedCategory?.description || 'No description provided for this category.'}</p>
                                    </div>
                                </div>
                            </div>

                            {selectedCategory?.products?.length > 0 && (
                                <div className="view-section" style={{ marginTop: '24px' }}>
                                    <h4 className="view-section-header">
                                        <Icons.Product size={18} />
                                        Linked Products ({selectedCategory.products.length})
                                    </h4>
                                    <div className="mt-16" style={{ border: '1px solid var(--gray-100)', borderRadius: '8px', overflow: 'hidden' }}>
                                        <Table
                                            columns={linkColumns}
                                            data={selectedCategory?.products || []}
                                            className="common-table"
                                            searchable={false}
                                            itemsPerPage={5}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="common-form">
                            <Input
                                label="Category Name"
                                value={formData.category_name}
                                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                                error={formErrors.category_name}
                                required
                                placeholder="e.g., Electronics, Beverages"
                            />

                            <Input
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                error={formErrors.description}
                                placeholder="Describe the category..."
                            />
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Category;
