import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import Alert from '../../components/common/Alert/Alert';
import Select from '../../components/common/Select/Select';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import { useAuth } from '../../context/AuthContext';
import employeeApi from '../../api/employee.api';
import storeApi from '../../api/store.api';
import warehouseApi from '../../api/warehouse.api';
import roleApi from '../../api/role.api';
import Icons from '../../components/common/Icons';


// Role constants
const STORE_ROLES = ['Cashier', 'Inventory Staff'];
const WH_ROLES = ['Warehouse Staff'];

const emptyForm = {
    name: '',
    email: '',
    password: '',
    phone: '',
    role_id: '',
    store_id: '',
    warehouse_id: ''
};

const Employees = () => {
    const { user } = useAuth();
    const isStoreOwner = user?.role_name === 'Store Owner';
    const isStoreManager = user?.role_name === 'Store Manager';
    const canManage = isStoreOwner || isStoreManager;

    // ── State ─────────────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState('store'); // 'store' | 'warehouse'
    const [employees, setEmployees] = useState([]);
    const [stores, setStores] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [allRoles, setAllRoles] = useState([]);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
    const [loading, setLoading] = useState(true);
    const [tableLoading, setTableLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [modalType, setModalType] = useState('add');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({ ...emptyForm });
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // ── All hooks unconditional ───────────────────────────────────────────────
    useEffect(() => {
        if (canManage) {
            Promise.all([
                fetchInitialData(),
                fetchRoles()
            ]).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    // When tab or selected store/warehouse changes, reload employees
    useEffect(() => {
        if (!canManage) return;
        if (activeTab === 'store' && selectedStoreId) {
            loadStoreEmployees(selectedStoreId);
        } else if (activeTab === 'warehouse' && selectedWarehouseId && isStoreOwner) {
            loadWarehouseEmployees(selectedWarehouseId);
        } else {
            setEmployees([]);
        }
    }, [activeTab, selectedStoreId, selectedWarehouseId]);

    // ── Access guard ──────────────────────────────────────────────────────────
    if (!canManage) {
        return (
            <MainLayout>
                <div className="employees-container">
                    <div className="employees-header">
                        <div><h1>Employee Management</h1><p>Access restricted for your role</p></div>
                    </div>
                    <Card className="employees-table-card">
                        <EmptyState icon={<Icons.Lock size={48} />} title="Access Restricted"
                            description="Only Store Owners and Store Managers can access the Employee Management module." />
                    </Card>
                </div>
            </MainLayout>
        );
    }

    // ── Data loaders ──────────────────────────────────────────────────────────
    const fetchInitialData = async () => {
        try {
            if (isStoreOwner) {
                const [storeRes, whRes] = await Promise.all([
                    storeApi.getAllStores(),
                    warehouseApi.getAllWarehouses()
                ]);
                const storeList = storeRes.data || [];
                const whList = whRes.data || [];
                setStores(storeList);
                setWarehouses(whList);
                if (storeList.length) setSelectedStoreId(String(storeList[0].id));
                if (whList.length) setSelectedWarehouseId(String(whList[0].id));
            } else if (isStoreManager) {
                // Store Manager: Only fetch their assigned store
                const res = await storeApi.getStoreById(user.store_id);
                if (res.data) {
                    setStores([res.data]);
                    setSelectedStoreId(String(res.data.id));
                }
            }
        } catch (err) {
            showAlert('error', 'Failed to load initial data' + err);
        }
    };

    const fetchRoles = async () => {
        try {
            const res = await roleApi.getActiveRoles();
            // Handle both shapes: array directly or { data: [...] }
            const roles = Array.isArray(res) ? res
                : Array.isArray(res?.data) ? res.data
                    : [];
            setAllRoles(roles);
        } catch (err) {
            console.error('Failed to load roles:', err);
        }
    };

    const loadStoreEmployees = async (storeId) => {
        setTableLoading(true);
        try {
            const res = await employeeApi.getEmployeesByStore(storeId);
            const data = res.data || [];
            if (isStoreManager) {
                setEmployees(data.filter(emp => emp.role_name !== 'Store Manager'));
            } else {
                setEmployees(data);
            }
        } catch (err) {
            console.error('Load store employees error:', err);
            setEmployees([]);
        } finally {
            setTableLoading(false);
        }
    };

    const loadWarehouseEmployees = async (warehouseId) => {
        setTableLoading(true);
        try {
            const res = await employeeApi.getEmployeesByWarehouse(warehouseId);
            setEmployees(res.data || []);
        } catch (err) {
            console.error('Load warehouse employees error:', err);
            setEmployees([]);
        } finally {
            setTableLoading(false);
        }
    };

    // ── Helpers ───────────────────────────────────────────────────────────────
    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 3500);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEmployees([]);
        setSelectedEmployee(null);
        setShowModal(false);
        setAlert({ show: false, type: '', message: '' });
    };

    const availableRoles = allRoles.filter(r => {
        if (activeTab === 'store') {
            const ownerStoreRoles = ['Store Manager', 'Cashier', 'Inventory Staff'];
            const managerStoreRoles = ['Cashier', 'Inventory Staff'];
            return isStoreOwner
                ? ownerStoreRoles.includes(r.role_name)
                : managerStoreRoles.includes(r.role_name);
        } else {
            return isStoreOwner && r.role_name === 'Warehouse Staff';
        }
    });

    // ── Modal helpers ─────────────────────────────────────────────────────────
    const handleOpenModal = (type, employee = null) => {
        setModalType(type);
        setSelectedEmployee(employee);
        if (employee) {
            setFormData({
                name: employee.name || '',
                email: employee.email || '',
                password: '',
                phone: employee.phone || '',
                role_id: String(employee.role_id || ''),
                store_id: employee.store_id ? String(employee.store_id) : '',
                warehouse_id: employee.warehouse_id ? String(employee.warehouse_id) : ''
            });
        } else {
            setFormData({
                ...emptyForm,
                store_id: activeTab === 'store' ? selectedStoreId : '',
                warehouse_id: activeTab === 'warehouse' ? selectedWarehouseId : '',
                role_id: availableRoles.length === 1 ? String(availableRoles[0].id) : ''
            });
        }
        setFormErrors({});
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedEmployee(null);
        setFormData({ ...emptyForm });
        setFormErrors({});
    };

    // ── Validation ────────────────────────────────────────────────────────────
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'Name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Enter a valid email';

        if (modalType === 'add') {
            if (!formData.password) errors.password = 'Password is required';
            else if (formData.password.length < 6) errors.password = 'Minimum 6 characters';
        } else if (modalType === 'edit' && formData.password) {
            if (formData.password.length < 6) errors.password = 'Minimum 6 characters';
        }

        if (!formData.role_id) errors.role_id = 'Role is required';

        if (formData.phone) {
            if (!/^[0-9]{10}$/.test(formData.phone)) {
                errors.phone = 'Phone number must be exactly 10 digits';
            }
        }

        return errors;
    };

    // ── Submit ────────────────────────────────────────────────────────────────
    const handleSubmit = async () => {
        const errors = validateForm();
        if (Object.keys(errors).length) {
            setFormErrors(errors);
            return;
        }

        try {
            if (modalType === 'add') {
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    phone: formData.phone || null,
                    role_id: parseInt(formData.role_id),
                    store_id: activeTab === 'store' ? parseInt(selectedStoreId) : null,
                    warehouse_id: activeTab === 'warehouse' ? parseInt(selectedWarehouseId) : null,
                    created_by: user.id
                };
                await employeeApi.createEmployee(payload);
                showAlert('success', 'Employee created successfully');
            } else if (modalType === 'edit') {
                const payload = {
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone || null,
                    role_id: parseInt(formData.role_id),
                    updated_by: user.id
                };
                if (formData.password) {
                    payload.password = formData.password;
                }
                await employeeApi.updateEmployee(selectedEmployee.id, payload);
                showAlert('success', 'Employee updated successfully');
            }
            if (activeTab === 'store' && selectedStoreId) loadStoreEmployees(selectedStoreId);
            else if (activeTab === 'warehouse' && selectedWarehouseId) loadWarehouseEmployees(selectedWarehouseId);
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Operation failed');
        }
    };

    const handleDelete = async () => {
        try {
            await employeeApi.deleteEmployee(selectedEmployee.id);
            showAlert('success', 'Employee removed successfully');
            if (activeTab === 'store' && selectedStoreId) loadStoreEmployees(selectedStoreId);
            else if (activeTab === 'warehouse' && selectedWarehouseId) loadWarehouseEmployees(selectedWarehouseId);
            handleCloseModal();
        } catch (err) {
            showAlert('error', err.message || 'Failed to delete employee');
        }
    };

    const handleToggleStatus = async (emp) => {
        try {
            await employeeApi.toggleEmployeeStatus(emp.id);
            showAlert('success', `Employee ${!emp.is_active ? 'activated' : 'deactivated'}`);
            if (activeTab === 'store' && selectedStoreId) loadStoreEmployees(selectedStoreId);
            else if (activeTab === 'warehouse' && selectedWarehouseId) loadWarehouseEmployees(selectedWarehouseId);
        } catch (err) {
            showAlert('error', err.message || 'Failed to update status');
        }
    };

    // ── Table columns ─────────────────────────────────────────────────────────
    const columns = [
        {
            title: 'No',
            key: 'index',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Employee',
            key: 'name',
            render: (value, record) => (
                <div className="table-profile-cell">
                    <div className="table-profile-avatar">{value?.charAt(0).toUpperCase()}</div>
                    <div className="table-info-group">
                        <span className="table-name-cell">{value}</span>
                        <small className="table-secondary-text">{record.email}</small>
                    </div>
                </div>
            )
        },
        {
            title: 'Role',
            key: 'role_name',
            render: (value) => (
                <Badge variant="primary" className="badge-status">{value}</Badge>
            )
        },
        {
            title: 'Phone',
            key: 'phone',
            render: (value) => value ? <span className="table-contact-phone">{value}</span> :
                <span className="emp-na">—</span>
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
            render: (value, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                        {record.created_by_name ? `By ${record.created_by_name}` : (record.created_by ? `By User #${record.created_by}` : 'By System')}
                    </small>
                </div>
            )
        },
        {
            title: 'Updated',
            key: 'updated_at',
            render: (value, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{new Date(value).toLocaleDateString()}</span>
                    <small style={{ color: 'var(--gray-600)', fontSize: '12px' }}>
                        {record.updated_by_name ? `By ${record.updated_by_name}` : (record.updated_by ? `By User #${record.updated_by}` : 'By System')}
                    </small>
                </div>
            )
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

    if (loading) {
        return (
            <MainLayout>
                <div className="page-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    const currentStore = stores.find(s => String(s.id) === selectedStoreId);
    const currentWarehouse = warehouses.find(w => String(w.id) === selectedWarehouseId);

    return (
        <MainLayout>
            <div className="employees-container">
                <div className="page-header">
                    <div>
                        <h1>Employee Management</h1>
                        <p>Manage staff across your stores and warehouses</p>
                    </div>
                    <div className="header-actions">
                        <Button variant="primary" onClick={() => handleOpenModal('add')}>
                            <Icons.Plus size={18} /> Add Employee
                        </Button>
                    </div>
                </div>

                {alert.show && <Alert type={alert.type} dismissible>{alert.message}</Alert>}

                <div className="common-tabs">
                    <button
                        className={`common-tab ${activeTab === 'store' ? 'active' : ''}`}
                        onClick={() => handleTabChange('store')}
                    >
                        <Icons.Store size={18} style={{ marginRight: '8px' }} /> Store Employees
                        {activeTab === 'store' && employees.length > 0 && (
                            <span className="common-tab-count">{employees.length}</span>
                        )}
                    </button>
                    {isStoreOwner && (
                        <button
                            className={`common-tab ${activeTab === 'warehouse' ? 'active' : ''}`}
                            onClick={() => handleTabChange('warehouse')}
                        >
                            <Icons.Warehouse size={18} style={{ marginRight: '8px' }} /> Warehouse Employees
                            {activeTab === 'warehouse' && employees.length > 0 && (
                                <span className="common-tab-count">{employees.length}</span>
                            )}
                        </button>
                    )}
                </div>

                <div className="horizontal-selector-card" style={{ marginBottom: '24px' }}>
                    <div className="selector-main">
                        <div className="selector-label">
                            {activeTab === 'store' ? <Icons.Store size={20} /> : <Icons.Warehouse size={20} />}
                            <span>{activeTab === 'store' ? (isStoreManager ? 'Your Store' : 'Select Store') : 'Select Warehouse'}</span>
                        </div>
                        <div className="selector-controls">
                            {activeTab === 'store' ? (
                                stores.length > 0 ? (
                                    <Select
                                        value={selectedStoreId}
                                        onChange={(e) => setSelectedStoreId(e.target.value)}
                                        disabled={isStoreManager}
                                        options={stores.map(s => ({ value: s.id, label: `${s.store_name} (${s.store_code})` }))}
                                    />
                                ) : <p className="sub-text">No stores found.</p>
                            ) : (
                                warehouses.length > 0 ? (
                                    <Select
                                        value={selectedWarehouseId}
                                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                        options={warehouses.map(w => ({ value: w.id, label: `${w.warehouse_name} (${w.warehouse_code})` }))}
                                    />
                                ) : <p className="sub-text">No warehouses found.</p>
                            )}
                        </div>
                    </div>
                    <div className="selector-meta">
                        <span>Manages:</span>
                        <div className="emp-role-info">
                            {activeTab === 'store' ? (
                                (isStoreOwner ? ['Store Manager', 'Cashier', 'Inventory Staff'] : ['Cashier', 'Inventory Staff']).map(r => (
                                    <Badge key={r} variant="info" size="small">{r}</Badge>
                                ))
                            ) : (
                                WH_ROLES.map(r => <Badge key={r} variant="info" size="small">{r}</Badge>)
                            )}
                        </div>
                    </div>
                </div>

                <Card className="employees-table-card">
                    {tableLoading ? (
                        <div className="page-loading" style={{ minHeight: '200px' }}><Loader /></div>
                    ) : (activeTab === 'store' && !selectedStoreId) || (activeTab === 'warehouse' && !selectedWarehouseId) ? (
                        <EmptyState icon={<Icons.Filter size={48} />} title="Select a Location"
                            description={`Choose a ${activeTab === 'store' ? 'store' : 'warehouse'} above to view its employees.`} />
                    ) : employees.length > 0 ? (
                        <Table
                            columns={columns}
                            data={employees}
                            className="common-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Employees"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.User size={48} />}
                            title="No Employees Found"
                            description={`No employees assigned to this ${activeTab === 'store' ? 'store' : 'warehouse'} yet.`}
                            action={
                                <Button onClick={() => handleOpenModal('add')}>Add First Employee</Button>
                            }
                        />
                    )}
                </Card>

                <Modal
                    isOpen={showModal}
                    onClose={handleCloseModal}
                    title={
                        modalType === 'add' ? 'Add New Employee' :
                            modalType === 'edit' ? 'Edit Employee' :
                                modalType === 'view' ? 'Employee Details' :
                                    'Remove Employee'
                    }
                    footer={
                        modalType === 'delete' ? (
                            <><Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="danger" onClick={handleDelete}>Remove Employee</Button></>
                        ) : modalType === 'view' ? (
                            <Button variant="outline" onClick={handleCloseModal}>Close</Button>
                        ) : (
                            <><Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                                <Button variant="primary" onClick={handleSubmit}>
                                    {modalType === 'add' ? 'Create Employee' : 'Update Employee'}
                                </Button></>
                        )
                    }
                >
                    {modalType === 'delete' ? (
                        <div className="delete-confirmation">
                            <div className="delete-icon"><Icons.AlertTriangle size={48} color="var(--warning-color)" /></div>
                            <p>Are you sure you want to remove <strong>{selectedEmployee?.name}</strong> from the system?</p>
                            <div className="delete-details">
                                <span>Role: {selectedEmployee?.role_name}</span>
                                <span>Email: {selectedEmployee?.email}</span>
                            </div>
                            <p className="delete-warning">This action cannot be undone.</p>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    {selectedEmployee?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedEmployee?.name}</h2>
                                    <div className="detail-meta">
                                        <Badge variant="primary" className="badge-status">{selectedEmployee?.role_name}</Badge>
                                        <Badge variant={selectedEmployee?.is_active ? 'success' : 'danger'} className="badge-status">
                                            {selectedEmployee?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>

                            <div className="view-section">
                                <h4 className="view-section-header">Employment Information</h4>
                                <div className="view-grid">
                                    <div className="view-group">
                                        <label>Email Address</label>
                                        <p style={{ textTransform: 'none' }}>{selectedEmployee?.email}</p>
                                    </div>
                                    <div className="view-group">
                                        <label>Phone Number</label>
                                        <p>{selectedEmployee?.phone || 'Not Provided'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="common-form">
                            <div className="info-banner-card">
                                <div className="icon-box">
                                    {activeTab === 'store' ? <Icons.Store size={24} /> : <Icons.Warehouse size={24} />}
                                </div>
                                <div className="content">
                                    <span className="label">
                                        {activeTab === 'store' ? 'Assigning to Store' : 'Assigning to Warehouse'}
                                    </span>
                                    <span className="value">
                                        {activeTab === 'store' ? (currentStore?.store_name || '—') : (currentWarehouse?.warehouse_name || '—')}
                                    </span>
                                </div>
                            </div>

                            <div className="common-form-grid">
                                <Input label="Full Name" value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    error={formErrors.name} placeholder="Enter full name" required />
                                <Input label="Email Address" value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    error={formErrors.email} placeholder="Enter email" type="email" required />
                                <Input label="Password" value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    error={formErrors.password} placeholder={modalType === 'add' ? 'Minimum 6 characters' : 'Leave blank to keep current'}
                                    type="password" required={modalType === 'add'} />
                                <Input label="Phone Number" value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    error={formErrors.phone} placeholder="10 digits (optional)" />
                                <Select
                                    label="Role"
                                    required
                                    value={formData.role_id}
                                    onChange={e => setFormData({ ...formData, role_id: e.target.value })}
                                    error={formErrors.role_id}
                                    options={[
                                        { value: '', label: '— Select Role —' },
                                        ...availableRoles.map(r => ({ value: r.id, label: r.role_name }))
                                    ]}
                                />
                            </div>

                            {modalType === 'edit' && (
                                <div className="form-info mt-16">
                                    <p>• Leave password blank if you don't want to change it</p>
                                    <p>• Location assignment (Store/Warehouse) cannot be modified after creation</p>
                                </div>
                            )}
                        </div>
                    )}
                </Modal>
            </div>
        </MainLayout>
    );
};

export default Employees;
