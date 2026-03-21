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
import roleApi from '../../api/role.api';
import employeeApi from '../../api/employee.api';
import Icons from '../../components/common/Icons';
import './Roles.css';

const Roles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add'); // 'add', 'edit', 'view', 'delete'
    const [selectedRole, setSelectedRole] = useState(null);
    const [roleUsers, setRoleUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const [formData, setFormData] = useState({
        role_name: '',
        description: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            setLoading(true);
            const response = await roleApi.getAllRoles();
            setRoles(response.data);
            setError(null);
        } catch (err) {
            setError(err.message || 'Failed to fetch roles');
            showAlert('error', err.message || 'Failed to fetch roles');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3000);
    };

    const fetchRoleUsers = async (roleId) => {
        try {
            setLoadingUsers(true);
            const response = await employeeApi.getAllEmployees();
            const usersArray = Array.isArray(response.data) ? response.data : (Array.isArray(response) ? response : []);
            const filtered = usersArray.filter(u => Number(u.role_id) === Number(roleId));
            setRoleUsers(filtered);
        } catch (err) {
            console.error('Failed to fetch role users', err);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleOpenModal = (type, role = null) => {
        setModalType(type);
        setSelectedRole(role);
        if (role) {
            setFormData({
                role_name: role.role_name,
                description: role.description || ''
            });
            if (type === 'view') {
                fetchRoleUsers(role.id);
            }
        } else {
            setFormData({
                role_name: '',
                description: ''
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedRole(null);
        setRoleUsers([]);
        setFormData({
            role_name: '',
            description: ''
        });
        setFormErrors({});
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.role_name) {
            errors.role_name = 'Role name is required';
        } else if (formData.role_name.length > 50) {
            errors.role_name = 'Role name cannot exceed 50 characters';
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
            if (modalType === 'add') {
                // Send only required fields - no created_by or updated_by
                const roleData = {
                    role_name: formData.role_name,
                    description: formData.description || null
                };
                await roleApi.createRole(roleData);
                showAlert('success', 'Role created successfully');
            } else if (modalType === 'edit') {
                // For edit, send only fields that are being updated
                const roleData = {};
                if (formData.role_name !== selectedRole.role_name) {
                    roleData.role_name = formData.role_name;
                }
                if (formData.description !== selectedRole.description) {
                    roleData.description = formData.description || null;
                }
                await roleApi.updateRole(selectedRole.id, roleData);
                showAlert('success', 'Role updated successfully');
            }

            fetchRoles();
            handleCloseModal();
        } catch (err) {
            console.error('Submit Error:', err);
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await roleApi.deleteRole(selectedRole.id);
            showAlert('success', 'Role deleted successfully');
            fetchRoles();
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete role');
        }
    };

    const handleToggleStatus = async (role) => {
        try {
            await roleApi.updateRole(role.id, { is_active: !role.is_active });
            showAlert('success', `Role ${!role.is_active ? 'activated' : 'deactivated'} successfully`);
            fetchRoles();
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Role Name',
            key: 'role_name',
            render: (value, record) => (
                <div className="table-info-group">
                    <span className="table-name-cell">{value}</span>
                    {record.description && (
                        <small className="table-secondary-text">{record.description}</small>
                    )}
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
            title: 'Created',
            key: 'created_at',
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            title: 'Updated',
            key: 'updated_at',
            render: (value) => new Date(value).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="common-action-menu" onClick={(e) => { e.stopPropagation(); }}>
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
                                {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                            </button>
                            <button className="action-item" onClick={() => { handleOpenModal('edit', record); setActiveDropdown(null); }}>
                                <Icons.Edit size={16} /> Edit
                            </button>
                            <button 
                                onClick={() => { handleOpenModal('delete', record); setActiveDropdown(null); }} 
                                disabled={Number(record.user_count) > 0}
                                className="action-item delete-item"
                            >
                                <Icons.Delete size={16} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    const userColumns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Name',
            key: 'name',
            className: 'table-name-cell'
        },
        {
            title: 'Email',
            key: 'email'
        }
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="roles-loading">
                    <Loader size="large" />
                    <p>Loading roles...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="roles-container">
                {/* Header */}
                <div className="roles-header">
                    <div>
                        <h1>Role Management</h1>
                        <p>Manage system roles and permissions</p>
                    </div>
                    <div className="header-actions">
                        <Button
                            variant="primary"
                            onClick={() => handleOpenModal('add')}
                        >
                            <Icons.Plus size={18} /> Create New Role
                        </Button>
                    </div>
                </div>

                {/* Alert */}
                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                {/* Roles Table */}
                <Card className="roles-table-card">
                    {roles.length > 0 ? (
                        <Table
                            columns={columns}
                            data={roles}
                            className="roles-table"
                            searchable={false}
                            columnSearchable={true}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.Shield size={48} />}
                            title="No Roles Found"
                            description="Get started by creating your first role"
                            action={
                                <Button onClick={() => handleOpenModal('add')}>
                                    <Icons.Plus size={18} /> Create Role
                                </Button>
                            }
                        />
                    )}
                </Card>

                {/* Role Modal */}
                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Create New Role' :
                            modalType === 'edit' ? 'Edit Role' :
                                modalType === 'view' ? 'View Role' :
                                    'Delete Role'
                    }
                    footer={
                        modalType === 'delete' ? (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="danger" onClick={handleDelete}>
                                    Delete Role
                                </Button>
                            </>
                        ) : modalType === 'view' ? (
                            <Button variant="outline" onClick={handleCloseModal}>
                                Close
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" onClick={handleCloseModal}>
                                    Cancel
                                </Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Role' : 'Update Role'}
                                </Button>
                            </>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--danger-color)" /></div>
                            <p>Are you sure you want to delete the role <strong>{selectedRole?.role_name}</strong>?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            {selectedRole?.user_count > 0 && (
                                <p className="delete-error">
                                    Cannot delete role as it is assigned to {selectedRole.user_count} user(s)
                                </p>
                            )}
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="role-view">
                            <div className="role-details">
                                <h3>{selectedRole?.role_name}</h3>
                                <p>{selectedRole?.description || 'No description provided'}</p>
                            </div>
                            <div className="role-users-section" style={{ marginTop: '20px' }}>
                                <h4>Users with this role ({selectedRole?.user_count || 0})</h4>
                                {loadingUsers ? (
                                    <Loader size="small" />
                                ) : roleUsers.length > 0 ? (
                                    <div className="role-users-table-container" style={{ marginTop: '15px' }}>
                                        <Table
                                            columns={userColumns}
                                            data={roleUsers}
                                            searchable={false}
                                            itemsPerPage={5}
                                        />
                                    </div>
                                ) : (
                                    <p style={{ color: '#666', marginTop: '10px' }}>No users found for this role.</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="role-form">
                            <Input
                                label="Role Name"
                                value={formData.role_name}
                                onChange={(e) => setFormData({...formData, role_name: e.target.value})}
                                error={formErrors.role_name}
                                placeholder="Enter role name"
                                required
                            />
                            <Input
                                label="Description"
                                value={formData.description}
                                onChange={(e) => setFormData({...formData, description: e.target.value})}
                                error={formErrors.description}
                                placeholder="Enter role description (optional)"
                            />
                            {modalType === 'edit' && (
                                <div className="form-info">
                                    <small>Status can be toggled using the button in the table</small>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Roles;