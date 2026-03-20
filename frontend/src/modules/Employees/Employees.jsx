import React, {useState, useEffect} from 'react';
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
import {useAuth} from '../../context/AuthContext';
import employeeApi from '../../api/employee.api';
import storeApi from '../../api/store.api';
import warehouseApi from '../../api/warehouse.api';
import roleApi from '../../api/role.api';
import Icons from '../../components/common/Icons';
import './Employees.css';

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
    const {user} = useAuth();
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
    const [formData, setFormData] = useState({...emptyForm});
    const [formErrors, setFormErrors] = useState({});
    const [alert, setAlert] = useState({show: false, type: '', message: ''});
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
                        <EmptyState icon={<Icons.Lock size={48}/>} title="Access Restricted"
                                    description="Only Store Owners and Store Managers can access the Employee Management module."/>
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
            showAlert('error', 'Failed to load initial data');
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
            setEmployees(res.data || []);
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
        setAlert({show: true, type, message});
        setTimeout(() => setAlert({show: false, type: '', message: ''}), 3500);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEmployees([]);
        setSelectedEmployee(null);
        setShowModal(false);
        setAlert({show: false, type: '', message: ''});
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
        setFormData({...emptyForm});
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
            title: 'ID',
            key: 'id',
            render: (value) => <span className="emp-id">#{value}</span>
        },
        {
            title: 'Employee',
            key: 'name',
            render: (value, record) => (
                <div className="emp-info-cell">
                    <div className="emp-avatar">{value?.charAt(0).toUpperCase()}</div>
                    <div>
                        <strong>{value}</strong>
                        <small>{record.email}</small>
                    </div>
                </div>
            )
        },
        {
            title: 'Role',
            key: 'role_name',
            render: (value) => (
                <Badge variant="primary" className="role-badge">{value}</Badge>
            )
        },
        {
            title: 'Phone',
            key: 'phone',
            render: (value) => value ? <> {value}</> :
                <span className="emp-na">—</span>
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
                <div className="action-menu-container" onClick={(e) => { e.stopPropagation(); }}>
                    <button 
                        className="action-menu-trigger" 
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === record.id ? null : record.id);
                        }}
                    >
                        <Icons.Actions size={16} />
                    </button>
                    {activeDropdown === record.id && (
                        <div className="action-menu-dropdown">
                            <button onClick={() => { handleOpenModal('view', record); setActiveDropdown(null); }}>
                                <Icons.View size={16} /> View
                            </button>
                            <button onClick={() => { handleToggleStatus(record); setActiveDropdown(null); }}>
                                {record.is_active ? <><Icons.XCircle size={16} color="#ef4444" /> Deactivate</> : <><Icons.CheckCircle size={16} color="#10b981" /> Activate</>}
                            </button>
                            <button onClick={() => { handleOpenModal('edit', record); setActiveDropdown(null); }}>
                                <Icons.Edit size={16} /> Edit
                            </button>
                            <button 
                                onClick={() => { handleOpenModal('delete', record); setActiveDropdown(null); }}
                                className="delete-action-btn"
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
                <div className="employees-loading">
                    <Loader size="large"/><p>Loading employees...</p>
                </div>
            </MainLayout>
        );
    }

    const currentStore = stores.find(s => String(s.id) === selectedStoreId);
    const currentWarehouse = warehouses.find(w => String(w.id) === selectedWarehouseId);

    return (
        <MainLayout>
            <div className="employees-container">
                <div className="employees-header">
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

                <div className="emp-tabs">
                    <button
                        className={`emp-tab ${activeTab === 'store' ? 'active' : ''}`}
                        onClick={() => handleTabChange('store')}
                    >
                        <Icons.Store size={18} style={{marginRight: '8px'}}/> Store Employees
                        {activeTab === 'store' && employees.length > 0 && (
                            <span className="tab-count">{employees.length}</span>
                        )}
                    </button>
                    {isStoreOwner && (
                        <button
                            className={`emp-tab ${activeTab === 'warehouse' ? 'active' : ''}`}
                            onClick={() => handleTabChange('warehouse')}
                        >
                            <Icons.Warehouse size={18} style={{marginRight: '8px'}}/> Warehouse Employees
                            {activeTab === 'warehouse' && employees.length > 0 && (
                                <span className="tab-count">{employees.length}</span>
                            )}
                        </button>
                    )}
                </div>

                <Card className="emp-selector-card">
                    {activeTab === 'store' ? (
                        <div className="emp-selector-row">
                            <div className="emp-selector-label">
                                <Icons.Store size={20}/>
                                <span>{isStoreManager ? 'Your Store' : 'Select Store'}</span>
                            </div>
                            <div className="emp-selector-controls">
                                {stores.length > 0 ? (
                                    <select
                                        className="emp-native-select"
                                        value={selectedStoreId}
                                        onChange={(e) => setSelectedStoreId(e.target.value)}
                                        disabled={isStoreManager}
                                    >
                                        {stores.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.store_name} ({s.store_code})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span className="emp-no-context">No stores found. Create a store first.</span>
                                )}
                                {currentStore && (
                                    <div className="emp-context-badges">
                                        <Badge variant={currentStore.is_active ? 'success' : 'danger'} size="small">
                                            {currentStore.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <div className="emp-role-info">
                                <span>Manages:</span>
                                {isStoreOwner ? (
                                    ['Store Manager', 'Cashier', 'Inventory Staff'].map(r => <Badge key={r}
                                                                                                     variant="info"
                                                                                                     size="small">{r}</Badge>)
                                ) : (
                                    ['Cashier', 'Inventory Staff'].map(r => <Badge key={r} variant="info"
                                                                                    size="small">{r}</Badge>)
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="emp-selector-row">
                            <div className="emp-selector-label">
                                <Icons.Warehouse size={20}/>
                                <span>Select Warehouse</span>
                            </div>
                            <div className="emp-selector-controls">
                                {warehouses.length > 0 ? (
                                    <select
                                        className="emp-native-select"
                                        value={selectedWarehouseId}
                                        onChange={(e) => setSelectedWarehouseId(e.target.value)}
                                    >
                                        {warehouses.map(w => (
                                            <option key={w.id} value={w.id}>
                                                {w.warehouse_name} ({w.warehouse_code})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <span
                                        className="emp-no-context">No warehouses found. Create a warehouse first.</span>
                                )}
                                {currentWarehouse && (
                                    <div className="emp-context-badges">
                                        <Badge variant={currentWarehouse.is_active ? 'success' : 'danger'} size="small">
                                            {currentWarehouse.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                            <div className="emp-role-info">
                                <span>Manages:</span>
                                {WH_ROLES.map(r => <Badge key={r} variant="info" size="small">{r}</Badge>)}
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="employees-table-card">
                    {tableLoading ? (
                        <div className="emp-table-loading"><Loader/><p>Loading...</p></div>
                    ) : (activeTab === 'store' && !selectedStoreId) || (activeTab === 'warehouse' && !selectedWarehouseId) ? (
                        <EmptyState icon={<Icons.Filter size={48}/>} title="Select a Location"
                                    description={`Choose a ${activeTab === 'store' ? 'store' : 'warehouse'} above to view its employees.`}/>
                    ) : employees.length > 0 ? (
                        <Table 
                            columns={columns} 
                            data={employees} 
                            className="employees-table"
                            searchable={false}
                            columnSearchable={true}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.User size={48}/>}
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
                            <Button variant="primary" onClick={handleCloseModal}>Close</Button>
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
                            <div className="delete-icon"><Icons.Warning size={48} color="var(--warning-color)"/></div>
                            <p>Are you sure you want to remove <strong>{selectedEmployee?.name}</strong> from the system?</p>
                            <p className="delete-warning">This action cannot be undone.</p>
                            <p className="delete-info">
                                Employee: <strong>{selectedEmployee?.name}</strong> ({selectedEmployee?.role_name})
                            </p>
                        </div>
                    ) : modalType === 'view' ? (
                        <div className="emp-view" style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ marginBottom: '16px' }}>
                                <div className="emp-view-avatar" style={{ margin: '0 auto' }}>
                                    {selectedEmployee?.name?.charAt(0).toUpperCase()}
                                </div>
                            </div>
                            <h3 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--gray-800)', marginBottom: '8px' }}>{selectedEmployee?.name}</h3>
                            <Badge variant="primary" style={{ marginBottom: '24px' }}>{selectedEmployee?.role_name}</Badge>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left', background: 'var(--gray-50)', padding: '20px', borderRadius: '8px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Employee ID</span>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-800)', fontWeight: '600' }}>#{selectedEmployee?.id}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Email</span>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-800)', fontWeight: '600' }}>{selectedEmployee?.email}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Phone</span>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-800)', fontWeight: '600' }}>{selectedEmployee?.phone || '—'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Status</span>
                                    <Badge variant={selectedEmployee?.is_active ? 'success' : 'danger'}>{selectedEmployee?.is_active ? 'Active' : 'Inactive'}</Badge>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--gray-200)' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Created</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: 'var(--gray-800)', fontWeight: '600' }}>{selectedEmployee?.created_at ? new Date(selectedEmployee.created_at).toLocaleDateString() : 'N/A'}</div>
                                        <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>{selectedEmployee?.created_by_name ? `By ${selectedEmployee.created_by_name}` : ''}</small>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span style={{ fontSize: '14px', color: 'var(--gray-600)', fontWeight: '500' }}>Last Updated</span>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '14px', color: 'var(--gray-800)', fontWeight: '600' }}>{selectedEmployee?.updated_at ? new Date(selectedEmployee.updated_at).toLocaleDateString() : 'N/A'}</div>
                                        <small style={{ color: 'var(--gray-500)', fontSize: '12px' }}>{selectedEmployee?.updated_by_name ? `By ${selectedEmployee.updated_by_name}` : ''}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="emp-form">
                            <div className="emp-context-banner">
                                {activeTab === 'store' ? (
                                    <span><Icons.Store size={14}
                                                       style={{marginRight: '4px'}}/> Adding to: <strong>{currentStore?.store_name || '—'}</strong></span>
                                ) : (
                                    <span><Icons.Warehouse size={14}
                                                            style={{marginRight: '4px'}}/> Adding to: <strong>{currentWarehouse?.warehouse_name || '—'}</strong></span>
                                )}
                            </div>

                            <div className="form-row">
                                <Input label="Full Name" value={formData.name}
                                       onChange={e => setFormData({...formData, name: e.target.value})}
                                       error={formErrors.name} placeholder="Enter full name" required/>
                                <Input label="Email Address" value={formData.email}
                                       onChange={e => setFormData({...formData, email: e.target.value})}
                                       error={formErrors.email} placeholder="Enter email" type="email" required/>
                            </div>

                            <div className="form-row">
                                <Input label="Password" value={formData.password}
                                       onChange={e => setFormData({...formData, password: e.target.value})}
                                       error={formErrors.password} placeholder={modalType === 'add' ? 'Minimum 6 characters' : 'Leave blank to keep current'}
                                       type="password" required={modalType === 'add'}/>
                                <Input label="Phone Number" value={formData.phone}
                                       onChange={e => setFormData({...formData, phone: e.target.value})}
                                       error={formErrors.phone} placeholder="10 digits (optional)"/>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Role <span className="required-star">*</span></label>
                                    <select
                                        className={`emp-native-select ${formErrors.role_id ? 'select-error' : ''}`}
                                        value={formData.role_id}
                                        onChange={e => setFormData({...formData, role_id: e.target.value})}
                                    >
                                        <option value="">— Select Role —</option>
                                        {availableRoles.map(r => (
                                            <option key={r.id} value={r.id}>{r.role_name}</option>
                                        ))}
                                    </select>
                                    {formErrors.role_id && <span className="error-text">{formErrors.role_id}</span>}
                                </div>
                            </div>

                            {modalType === 'edit' && (
                                <div className="form-info">
                                    <small>• Leave password blank if you don't want to change it</small>
                                    <small>• Store/Warehouse assignment cannot be changed on edit</small>
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
