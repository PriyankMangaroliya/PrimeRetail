import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Button from '../../components/common/Button/Button';
import Icons from '../../components/common/Icons';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Card from '../../components/common/Card/Card';
import reportApi from '../../api/report.api';
import ExportUtils from './ExportUtils';

const ReportDetail = () => {
    const { reportId } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reportMetadata, setReportMetadata] = useState({});
    const [staffOptions, setStaffOptions] = useState([{ value: 'all', label: 'All Cashiers' }]);
    const [locationOptions, setLocationOptions] = useState([{ value: 'all', label: 'All My Locations' }]);
    const [storeOptions, setStoreOptions] = useState([{ value: 'all', label: 'All My Stores' }]);

    // Filter States
    const [timeRange, setTimeRange] = useState('all');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [filterValues, setFilterValues] = useState({});
    const [searchQuery, setSearchQuery] = useState('');

    // Report configuration
    const reportConfigs = {
        'store-owners': {
            title: 'Store Owners Report',
            description: 'In-depth analysis of store owner distributions and scale.',
            api: reportApi.getStoreOwnersReport,
            icon: <Icons.Users size={24} />,
            columns: [
                {
                    title: 'Owner Details',
                    key: 'name',
                    render: (value, record) => (
                        <div className="table-profile-cell">
                            <div className="table-profile-avatar">
                                {record.profile_image ? (
                                    <img src={record.profile_image} alt={value} />
                                ) : (
                                    value.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                )}
                            </div>
                            <div className="table-info-group">
                                <span className="table-name-cell">{value}</span>
                                <small className="table-secondary-text">{record.email}</small>
                            </div>
                        </div>
                    )
                },
                {
                    title: 'Phone',
                    key: 'phone',
                    render: (val) => val || 'N/A'
                },
                {
                    title: 'Portfolio Scale',
                    key: 'store_count',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span>{val} {val === 1 ? 'Store' : 'Stores'}</span>
                            <small className="table-secondary-text">{record.warehouse_count} Warehouses</small>
                        </div>
                    )
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Growth Date',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Owners', value: items.length, icon: <Icons.Users />, color: 'primary' },
                { label: 'Active Owners', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Total Stores', value: items.reduce((acc, curr) => acc + Number(curr.store_count), 0), icon: <Icons.Store />, color: 'info' },
                { label: 'Total Warehouses', value: items.reduce((acc, curr) => acc + Number(curr.warehouse_count), 0), icon: <Icons.Warehouse />, color: 'warning' }
            ]
        },
        'stores': {
            title: 'Inventory Locations (Stores)',
            description: 'Tracking all active retail outlets and their management.',
            api: reportApi.getStoresReport,
            icon: <Icons.Store size={24} />,
            columns: [
                {
                    title: 'Store Identity',
                    key: 'store_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="badge-code" style={{ padding: 0 }}>{record.store_code}</small>
                        </div>
                    )
                },
                {
                    title: 'Owner / Manager',
                    key: 'owner_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span>{val}</span>
                            <small className="table-secondary-text">{record.owner_email}</small>
                        </div>
                    )
                },
                {
                    title: 'Location',
                    key: 'city',
                    render: (val) => val || 'N/A'
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Established',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Stores', value: items.length, icon: <Icons.Store />, color: 'primary' },
                { label: 'Operational', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Closed/Inactive', value: items.filter(i => !i.is_active).length, icon: <Icons.XCircle />, color: 'danger' },
                { label: 'Unique Cities', value: new Set(items.map(i => i.city)).size, icon: <Icons.Location />, color: 'info' }
            ]
        },
        'warehouses': {
            title: 'Logistics Hubs (Warehouses)',
            description: 'Monitoring regional distribution centers and ownership.',
            api: reportApi.getWarehousesReport,
            icon: <Icons.Warehouse size={24} />,
            columns: [
                {
                    title: 'Warehouse Identity',
                    key: 'warehouse_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="badge-code" style={{ padding: 0 }}>{record.warehouse_code}</small>
                        </div>
                    )
                },
                {
                    title: 'Owner Responsibility',
                    key: 'owner_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span>{val}</span>
                            <small className="table-secondary-text">{record.owner_email}</small>
                        </div>
                    )
                },
                {
                    title: 'Base City',
                    key: 'city',
                    render: (val) => val || 'N/A'
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Established',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Hubs', value: items.length, icon: <Icons.Warehouse />, color: 'primary' },
                { label: 'Operational', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Inactive Hubs', value: items.filter(i => !i.is_active).length, icon: <Icons.XCircle />, color: 'danger' },
                { label: 'Owner Network', value: new Set(items.map(i => i.owner_name)).size, icon: <Icons.Users />, color: 'info' }
            ]
        },
        'roles': {
            title: 'Security Roles Report',
            description: 'Analytics on user role allocations and system utilization.',
            api: reportApi.getRolesReport,
            icon: <Icons.Shield size={24} />,
            columns: [
                {
                    title: 'Role Designation',
                    key: 'role_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.description || 'Standard Access Layer'}</small>
                        </div>
                    )
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Platform Utilization',
                    key: 'user_count',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span>{val} Total Users</span>
                            <small className="table-secondary-text" style={{ color: 'var(--success-color)' }}>{record.active_user_count} Active Entities</small>
                        </div>
                    )
                },
                {
                    title: 'Established',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Roles', value: items.length, icon: <Icons.Shield />, color: 'primary' },
                { label: 'Active Roles', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Total Users Assigned', value: items.reduce((acc, curr) => acc + Number(curr.user_count), 0), icon: <Icons.Users />, color: 'info' },
                { label: 'Active Personnel', value: items.reduce((acc, curr) => acc + Number(curr.active_user_count), 0), icon: <Icons.Activity />, color: 'warning' }
            ]
        },
        'taxes': {
            title: 'Global Taxes Report',
            description: 'Financial tax rate deployments and attachment distributions.',
            api: reportApi.getTaxesReport,
            icon: <Icons.Receipt size={24} />,
            columns: [
                {
                    title: 'Tax Protocol',
                    key: 'tax_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.description}</small>
                        </div>
                    )
                },
                {
                    title: 'Tax Rate (%)',
                    key: 'tax_rate',
                    render: (val) => <span className="badge-code">{Number(val).toFixed(2)}%</span>
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Usage Scope',
                    key: 'usage_count',
                    render: (val) => (
                        <span>{val} Attachments</span>
                    )
                },
                {
                    title: 'Launched',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Tax Zones', value: items.length, icon: <Icons.Receipt />, color: 'primary' },
                { label: 'Average Tax Rate', value: `${(items.reduce((acc, curr) => acc + Number(curr.tax_rate), 0) / (items.length || 1)).toFixed(2)}%`, icon: <Icons.Percent />, color: 'info' },
                { label: 'Global Attachments', value: items.reduce((acc, curr) => acc + Number(curr.usage_count), 0), icon: <Icons.Layers />, color: 'warning' },
                { label: 'Active Configurations', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' }
            ]
        },
        'payment-methods': {
            title: 'Payment Methods Report',
            description: 'Checkout gateways and system transaction analytics.',
            api: reportApi.getPaymentMethodsReport,
            icon: <Icons.CreditCard size={24} />,
            columns: [
                {
                    title: 'Gateway Name',
                    key: 'method_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.description || 'POS Terminal System'}</small>
                        </div>
                    )
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Active' : 'Inactive'}
                        </span>
                    )
                },
                {
                    title: 'Checkout Scope',
                    key: 'usage_count',
                    render: (val) => (
                        <span>{val} Transactions Attached</span>
                    )
                },
                {
                    title: 'Deployed',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleDateString(undefined, { dateStyle: 'medium' })
                }
            ],
            calcStats: (items) => [
                { label: 'Available Gateways', value: items.length, icon: <Icons.CreditCard />, color: 'primary' },
                { label: 'Active Gateways', value: items.filter(i => i.is_active).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Gateway Attachment Rate', value: items.reduce((acc, curr) => acc + Number(curr.usage_count), 0), icon: <Icons.Activity />, color: 'info' },
                { label: 'Inactive Infrastructures', value: items.filter(i => !i.is_active).length, icon: <Icons.XCircle />, color: 'danger' }
            ]
        },
        'warehouse-stock': {
            title: 'Current Stock',
            description: 'Direct volume tracker of inventory capabilities and shortages.',
            api: reportApi.getWarehouseStockReport,
            icon: <Icons.Layers size={24} />,
            hideTimeFilter: true,
            extraFilters: [
                {
                    label: 'Stock Status',
                    key: 'stockStatus',
                    options: [
                        { value: 'all', label: 'All Stock' },
                        { value: 'out_of_stock', label: 'Out Of Stock' },
                        { value: 'low_stock', label: 'Low Stock' }
                    ]
                }
            ],
            columns: [
                {
                    title: 'Item Description',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Current Holdings',
                    key: 'quantity',
                    render: (val, record) => {
                        const isLow = Number(val) > 0 && Number(val) <= Number(record.min_stock);
                        const isOut = Number(val) === 0;
                        return (
                            <span className={`badge-code ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                                {val} Units
                            </span>
                        );
                    }
                },
                {
                    title: 'Minimum Threshold',
                    key: 'min_stock',
                    render: (val) => <span>{val} Units</span>
                },
                {
                    title: 'Last Updated',
                    key: 'updated_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Tracked Products', value: items.length, icon: <Icons.Layers />, color: 'primary' },
                { label: 'Products In Stock', value: items.filter(i => Number(i.quantity) > 0).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Out of Stock', value: items.filter(i => Number(i.quantity) === 0).length, icon: <Icons.XCircle />, color: 'danger' },
                { label: 'Low Stock Alerts', value: items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_stock)).length, icon: <Icons.AlertCircle />, color: 'warning' }
            ]
        },
        'warehouse-transactions': {
            title: 'Stock Transactions',
            description: 'Warehouse movement directions covering receipts and damages.',
            api: reportApi.getWarehouseTransactionsReport,
            icon: <Icons.Activity size={24} />,
            extraFilters: [
                {
                    label: 'Movement Type',
                    key: 'transactionType',
                    options: [
                        { value: 'all', label: 'All Transactions' },
                        { value: 'ADD', label: 'Stock Additions' },
                        { value: 'TRANSFER', label: 'Transfers' },
                        { value: 'DAMAGED', label: 'Damages' },
                        { value: 'MANUAL_ADD', label: 'Manual Add' },
                        { value: 'MANUAL_REMOVE', label: 'Manual Remove' }
                    ]
                }
            ],
            columns: [
                {
                    title: 'Transaction Entity',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Movement',
                    key: 'movement_type',
                    render: (val, record) => {
                        const isOut = record.direction === 'OUT';
                        return (
                            <div className="table-info-group">
                                <span style={{ textTransform: 'uppercase', fontSize: '0.85em', fontWeight: 600 }}>{val}</span>
                                <small className={isOut ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>
                                    {isOut ? 'OUTBOUND' : 'INBOUND'}
                                </small>
                            </div>
                        );
                    }
                },
                {
                    title: 'Quantity',
                    key: 'quantity',
                    render: (val, record) => {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--gray-500)', fontSize: '0.9em' }}>{record.before_qty}</span>
                                <Icons.Forward size={14} color="var(--gray-400)" />
                                <span style={{ fontWeight: '600' }}>{record.after_qty}</span>
                                <span className={`badge-code ${record.direction === 'OUT' ? 'text-danger' : 'text-success'}`} style={{ marginLeft: 'auto' }}>
                                    {record.direction === 'OUT' ? '-' : '+'}{val}
                                </span>
                            </div>
                        );
                    }
                },
                {
                    title: 'Timestamp',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Movements', value: items.length, icon: <Icons.Activity />, color: 'primary' },
                { label: 'Inbound Flow', value: items.filter(i => i.direction === 'IN').length, icon: <Icons.Download />, color: 'success' },
                { label: 'Outbound Flow', value: items.filter(i => i.direction === 'OUT').length, icon: <Icons.Upload />, color: 'info' },
                { label: 'Damage Tickets', value: items.filter(i => i.movement_type === 'DAMAGED').length, icon: <Icons.XCircle />, color: 'danger' }
            ]
        },
        'inventory-stock': {
            title: 'Current Stock',
            description: 'Real-time tracking of product availability and low-stock alerts on the store floor.',
            api: reportApi.getInventoryStockReport,
            icon: <Icons.Layers size={24} />,
            hideTimeFilter: true,
            extraFilters: [
                {
                    label: 'Stock Status',
                    key: 'stockStatus',
                    options: [
                        { value: 'all', label: 'All Stock' },
                        { value: 'out_of_stock', label: 'Out Of Stock' },
                        { value: 'low_stock', label: 'Low Stock' }
                    ]
                }
            ],
            columns: [
                {
                    title: 'Item Description',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Current Holdings',
                    key: 'quantity',
                    render: (val, record) => {
                        const isLow = Number(val) > 0 && Number(val) <= Number(record.min_stock);
                        const isOut = Number(val) === 0;
                        return (
                            <span className={`badge-code ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                                {val} Units
                            </span>
                        );
                    }
                },
                {
                    title: 'Minimum Threshold',
                    key: 'min_stock',
                    render: (val) => <span>{val} Units</span>
                },
                {
                    title: 'Last Updated',
                    key: 'updated_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Tracked Products', value: items.length, icon: <Icons.Layers />, color: 'primary' },
                { label: 'Products In Stock', value: items.filter(i => Number(i.quantity) > 0).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Out of Stock', value: items.filter(i => Number(i.quantity) === 0).length, icon: <Icons.XCircle />, color: 'danger' },
                { label: 'Low Stock Alerts', value: items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_stock)).length, icon: <Icons.AlertCircle />, color: 'warning' }
            ]
        },
        'inventory-transactions': {
            title: 'Stock Transactions',
            description: 'Chronological history of store movements including returns and exchanges.',
            api: reportApi.getInventoryTransactionsReport,
            icon: <Icons.Activity size={24} />,
            extraFilters: [
                {
                    label: 'Movement Type',
                    key: 'transactionType',
                    options: [
                        { value: 'all', label: 'All Movements' },
                        { value: 'TRANSFER', label: 'Transfers' },
                        { value: 'DAMAGED', label: 'Damages' },
                        { value: 'RETURN', label: 'Returns' },
                        { value: 'EXCHANGE', label: 'Exchanges' },
                        { value: 'MANUAL_ADD', label: 'Manual Add' },
                        { value: 'MANUAL_REMOVE', label: 'Manual Remove' }
                    ]
                }
            ],
            columns: [
                {
                    title: 'Transaction Entity',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Movement',
                    key: 'movement_type',
                    render: (val, record) => {
                        const isOut = record.direction === 'OUT';
                        return (
                            <div className="table-info-group">
                                <span style={{ textTransform: 'uppercase', fontSize: '0.85em', fontWeight: 600 }}>{val}</span>
                                <small className={isOut ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>
                                    {isOut ? 'OUTBOUND' : 'INBOUND'}
                                </small>
                            </div>
                        );
                    }
                },
                {
                    title: 'Quantity',
                    key: 'quantity',
                    render: (val, record) => {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--gray-500)', fontSize: '0.9em' }}>{record.before_qty}</span>
                                <Icons.Forward size={14} color="var(--gray-400)" />
                                <span style={{ fontWeight: '600' }}>{record.after_qty}</span>
                                <span className={`badge-code ${record.direction === 'OUT' ? 'text-danger' : 'text-success'}`} style={{ marginLeft: 'auto' }}>
                                    {record.direction === 'OUT' ? '-' : '+'}{val}
                                </span>
                            </div>
                        );
                    }
                },
                {
                    title: 'Timestamp',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Movements', value: items.length, icon: <Icons.Activity />, color: 'primary' },
                { label: 'Inbound Flow', value: items.filter(i => i.direction === 'IN').length, icon: <Icons.Download />, color: 'success' },
                { label: 'Outbound Flow', value: items.filter(i => i.direction === 'OUT').length, icon: <Icons.Upload />, color: 'info' },
                { label: 'Returns/Exchanges', value: items.filter(i => ['RETURN', 'EXCHANGE'].includes(i.movement_type)).length, icon: <Icons.RefreshCw />, color: 'warning' }
            ]
        },
        'manager-top-selling': {
            title: 'Top Selling Products',
            description: 'Analytics on products with the highest sales volume across your store.',
            api: reportApi.getStoreManagerProductsReport,
            sortBy: 'total_selling',
            icon: <Icons.TrendingUp size={24} />,
            columns: [
                {
                    title: 'Product Details',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Unit Price',
                    key: 'price',
                    render: (val) => `₹${Number(val).toLocaleString()}`
                },
                {
                    title: 'Total Items Sold',
                    key: 'total_sold',
                    render: (val) => (
                        <span className="badge-code text-success" style={{ fontWeight: '600' }}>
                            {val} Units
                        </span>
                    )
                },
                {
                    title: 'Total Revenue',
                    key: 'total_revenue',
                    render: (val) => <span style={{ fontWeight: '600' }}>₹{Number(val).toLocaleString()}</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Products', value: items.length, icon: <Icons.Package />, color: 'primary' },
                { label: 'Units Sold', value: items.reduce((sum, i) => sum + Number(i.total_sold), 0).toLocaleString(), icon: <Icons.ShoppingCart />, color: 'success' },
                { label: 'Top Product', value: items.sort((a, b) => b.total_sold - a.total_sold)[0]?.product_name || 'N/A', icon: <Icons.Zap />, color: 'warning' },
                { label: 'Total Active Products', value: reportMetadata.totalActiveProducts || 0, icon: <Icons.Activity />, color: 'info' }
            ]
        },
        'manager-top-revenue': {
            title: 'Top Revenue Products',
            description: 'Analytics on products generating the most revenue for your store.',
            api: reportApi.getStoreManagerProductsReport,
            sortBy: 'top_revenue',
            icon: <Icons.DollarSign size={24} />,
            columns: [
                {
                    title: 'Product Details',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Unit Price',
                    key: 'price',
                    render: (val) => `₹${Number(val).toLocaleString()}`
                },
                {
                    title: 'Total Items Sold',
                    key: 'total_sold',
                    render: (val) => (
                        <span style={{ fontWeight: '600' }}>
                            {val} Units
                        </span>
                    )
                },
                {
                    title: 'Total Revenue',
                    key: 'total_revenue',
                    render: (val) => <span className="badge-code text-success" style={{ fontWeight: '600' }}>₹{Number(val).toLocaleString()}</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Products', value: items.length, icon: <Icons.Package />, color: 'primary' },
                { label: 'Units Sold', value: items.reduce((sum, i) => sum + Number(i.total_sold), 0).toLocaleString(), icon: <Icons.ShoppingCart />, color: 'success' },
                { label: 'Highest Revenue Prod', value: items.sort((a, b) => b.total_revenue - a.total_revenue)[0]?.product_name || 'N/A', icon: <Icons.Zap />, color: 'warning' },
                { label: 'Total Active Products', value: reportMetadata.totalActiveProducts || 0, icon: <Icons.Activity />, color: 'info' }
            ]
        },
        'manager-stock': {
            title: 'Current Stock',
            description: 'Real-time tracking of product availability and low-stock alerts on the store floor.',
            api: reportApi.getStoreManagerStockReport,
            hideTimeFilter: true,
            extraFilters: [
                {
                    label: 'Stock Status',
                    key: 'stockStatus',
                    options: [
                        { value: 'all', label: 'All Stock' },
                        { value: 'out_of_stock', label: 'Out Of Stock' },
                        { value: 'low_stock', label: 'Low Stock' }
                    ]
                }
            ],
            icon: <Icons.Layers size={24} />,
            columns: [
                {
                    title: 'Item Description',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Current Holdings',
                    key: 'quantity',
                    render: (val, record) => {
                        const isLow = Number(val) > 0 && Number(val) <= Number(record.min_stock);
                        const isOut = Number(val) === 0;
                        return (
                            <span className={`badge-code ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                                {val} Units
                            </span>
                        );
                    }
                },
                {
                    title: 'Minimum Threshold',
                    key: 'min_stock',
                    render: (val) => <span>{val} Units</span>
                },
                {
                    title: 'Last Updated',
                    key: 'updated_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Tracked Products', value: items.length, icon: <Icons.Layers />, color: 'primary' },
                { label: 'Products In Stock', value: items.filter(i => Number(i.quantity) > 0).length, icon: <Icons.CheckCircle />, color: 'success' },
                { label: 'Out of Stock', value: items.filter(i => Number(i.quantity) === 0).length, icon: <Icons.XCircle />, color: 'danger' },
                { label: 'Low Stock Alerts', value: items.filter(i => Number(i.quantity) > 0 && Number(i.quantity) <= Number(i.min_stock)).length, icon: <Icons.AlertCircle />, color: 'warning' }
            ]
        },
        'manager-transactions': {
            title: 'Inventory Transactions',
            description: 'Chronological history of store movements including returns and exchanges.',
            api: reportApi.getStoreManagerTransactionsReport,
            extraFilters: [
                {
                    label: 'Movement Type',
                    key: 'transactionType',
                    options: [
                        { value: 'all', label: 'All Movements' },
                        { value: 'TRANSFER', label: 'Transfers' },
                        { value: 'DAMAGED', label: 'Damages' },
                        { value: 'RETURN', label: 'Returns' },
                        { value: 'EXCHANGE', label: 'Exchanges' },
                        { value: 'MANUAL_ADD', label: 'Manual Add' },
                        { value: 'MANUAL_REMOVE', label: 'Manual Remove' }
                    ]
                }
            ],
            icon: <Icons.Layers size={24} />,
            columns: [
                {
                    title: 'Transaction Entity',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Movement',
                    key: 'movement_type',
                    render: (val, record) => {
                        const isOut = record.direction === 'OUT';
                        return (
                            <div className="table-info-group">
                                <span style={{ textTransform: 'uppercase', fontSize: '0.85em', fontWeight: 600 }}>{val}</span>
                                <small className={isOut ? 'text-danger' : 'text-success'} style={{ fontWeight: 600 }}>
                                    {isOut ? 'OUTBOUND' : 'INBOUND'}
                                </small>
                            </div>
                        );
                    }
                },
                {
                    title: 'Quantity',
                    key: 'quantity',
                    render: (val, record) => {
                        return (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ color: 'var(--gray-500)', fontSize: '0.9em' }}>{record.before_qty}</span>
                                <Icons.Forward size={14} color="var(--gray-400)" />
                                <span style={{ fontWeight: '600' }}>{record.after_qty}</span>
                                <span className={`badge-code ${record.direction === 'OUT' ? 'text-danger' : 'text-success'}`} style={{ marginLeft: 'auto' }}>
                                    {record.direction === 'OUT' ? '-' : '+'}{val}
                                </span>
                            </div>
                        );
                    }
                },
                {
                    title: 'Timestamp',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Movements', value: items.length, icon: <Icons.Activity />, color: 'primary' },
                { label: 'Inbound Flow', value: items.filter(i => i.direction === 'IN').length, icon: <Icons.Download />, color: 'success' },
                { label: 'Outbound Flow', value: items.filter(i => i.direction === 'OUT').length, icon: <Icons.Upload />, color: 'info' },
                { label: 'Returns/Exchanges', value: items.filter(i => ['RETURN', 'EXCHANGE'].includes(i.movement_type)).length, icon: <Icons.RefreshCw />, color: 'warning' }
            ]
        },
        'manager-invoices': {
            title: 'Store Invoices',
            description: 'All invoices processed in your store across all cashiers. Filter by date.',
            api: reportApi.getStoreManagerInvoicesReport,
            icon: <Icons.Invoice size={24} />,
            hideSearch: true,
            extraFilters: [
                {
                    label: 'Cashier',
                    key: 'cashierId',
                    options: staffOptions
                }
            ],
            columns: [
                {
                    title: 'Invoice Details',
                    key: 'invoice_no',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.invoice_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Staff (Cashier)',
                    key: 'cashier_name',
                    render: (val) => <span style={{ fontWeight: 500, color: 'var(--primary-main)' }}>{val}</span>
                },
                {
                    title: 'Customer',
                    key: 'customer_name',
                    render: (val) => val || 'Walk-in Customer'
                },
                {
                    title: 'Grand Total',
                    key: 'grand_total',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Date',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Total Invoices', value: items.length, icon: <Icons.FileText />, color: 'primary' },
                { label: 'Store Revenue', value: `₹${items.reduce((sum, i) => sum + Number(i.grand_total), 0).toLocaleString()}`, icon: <Icons.TrendingUp />, color: 'success' },
                { label: 'Sale Invoices', value: items.filter(i => i.invoice_type === 'SALE').length, icon: <Icons.Activity />, color: 'info' },
                { label: 'Active Cashiers', value: new Set(items.map(i => i.cashier_name)).size, icon: <Icons.Users />, color: 'warning' }
            ]
        },
        'manager-payments': {
            title: 'Store Payments',
            description: 'Complete log of all payments collected in your store. Review payment methods.',
            api: reportApi.getStoreManagerPaymentsReport,
            icon: <Icons.Banknote size={24} />,
            hideSearch: true,
            extraFilters: [
                {
                    label: 'Cashier',
                    key: 'cashierId',
                    options: staffOptions
                },
                {
                    label: 'Intake Type',
                    key: 'intakeType',
                    options: [
                        { label: 'All Intake', value: 'all' },
                        { label: 'Manual Intake', value: 'manual' },
                        { label: 'Digital Intake', value: 'digital' }
                    ]
                }
            ],
            columns: [
                {
                    title: 'Payment Type',
                    key: 'method_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val || 'N/A'}</span>
                            <small className="table-secondary-text">{record.payment_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Cashier',
                    key: 'cashier_name',
                    render: (val) => <span style={{ fontWeight: 500, color: 'var(--primary-main)' }}>{val}</span>
                },
                {
                    title: 'Invoice No',
                    key: 'invoice_no',
                    render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
                },
                {
                    title: 'Amount',
                    key: 'amount',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Date',
                    key: 'payment_date',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Store Transactions', value: items.length, icon: <Icons.Activity />, color: 'info' },
                { label: 'Total Collections', value: `₹${items.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.Banknote />, color: 'primary' },
                { label: 'Manual Intake', value: `₹${items.filter(i => !i.method_name?.toLowerCase()?.includes('razor')).reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.DollarSign />, color: 'success' },
                { label: 'Digital Intake', value: `₹${items.filter(i => i.method_name?.toLowerCase()?.includes('razor')).reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.Mobile />, color: 'warning' }
            ]
        },
        'cashier-invoices': {
            title: 'My Invoices',
            description: 'List of invoices processed by you. Filter by date to see your daily activity.',
            api: reportApi.getCashierInvoicesReport,
            icon: <Icons.Invoice size={24} />,
            hideSearch: true,
            columns: [
                {
                    title: 'Invoice Details',
                    key: 'invoice_no',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.invoice_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Customer',
                    key: 'customer_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val || 'Walk-in Customer'}</span>
                            <small className="table-secondary-text">{record.customer_phone || 'N/A'}</small>
                        </div>
                    )
                },
                {
                    title: 'Grand Total',
                    key: 'grand_total',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Date',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Your Invoices', value: items.length, icon: <Icons.FileText />, color: 'primary' },
                { label: 'Sales Volume', value: `₹${items.reduce((sum, i) => sum + Number(i.grand_total), 0).toLocaleString()}`, icon: <Icons.TrendingUp />, color: 'success' },
                { label: 'Avg Invoice', value: items.length ? `₹${(items.reduce((sum, i) => sum + Number(i.grand_total), 0) / items.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₹0', icon: <Icons.Activity />, color: 'info' },
                { label: 'Sales Activity', value: items.filter(i => i.invoice_type === 'SALE').length, icon: <Icons.CheckCircle />, color: 'warning' }
            ]
        },
        'cashier-payments': {
            title: 'My Payments',
            description: 'Detailed log of all payments you have collected from customers.',
            api: reportApi.getCashierPaymentsReport,
            icon: <Icons.Currency size={24} />,
            hideSearch: true,
            extraFilter: {
                label: 'Intake Type',
                key: 'intakeType',
                options: [
                    { label: 'All Intake', value: 'all' },
                    { label: 'Manual Intake', value: 'manual' },
                    { label: 'Digital Intake', value: 'digital' }
                ]
            },
            columns: [
                {
                    title: 'Payment Type',
                    key: 'method_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val || 'N/A'}</span>
                            <small className="table-secondary-text">{record.payment_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Invoice No',
                    key: 'invoice_no',
                    render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
                },
                {
                    title: 'Amount',
                    key: 'amount',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Status',
                    key: 'payment_status',
                    render: (val) => (
                        <span className={`badge-code ${val === 'COMPLETED' ? 'text-success' : 'text-danger'}`}>
                            {val || 'COMPLETED'}
                        </span>
                    )
                },
                {
                    title: 'Payment Date',
                    key: 'payment_date',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Your Transactions', value: items.length, icon: <Icons.Activity />, color: 'info' },
                { label: 'Total Collections', value: `₹${items.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.Banknote />, color: 'primary' },
                { label: 'Manual Intake', value: `₹${items.filter(i => !i.method_name?.toLowerCase()?.includes('razor')).reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.DollarSign />, color: 'success' },
                { label: 'Digital Intake', value: `₹${items.filter(i => i.method_name?.toLowerCase()?.includes('razor')).reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.Mobile />, color: 'warning' }
            ]
        },
        'owner-top-revenue-stores': {
            title: 'Top Revenue Stores',
            description: 'Compare performance across all your stores based on total revenue generated.',
            api: reportApi.getOwnerTopRevenueStoresReport,
            icon: <Icons.Store size={24} />,
            columns: [
                {
                    title: 'Store Identity',
                    key: 'store_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="badge-code" style={{ padding: 0 }}>{record.store_code}</small>
                        </div>
                    )
                },
                {
                    title: 'Location',
                    key: 'city',
                    render: (val) => val || 'N/A'
                },
                {
                    title: 'Invoice Volume',
                    key: 'invoice_count',
                    render: (val) => <span>{val} Invoices</span>
                },
                {
                    title: 'Total Revenue',
                    key: 'total_revenue',
                    render: (val) => <span className="badge-code text-success" style={{ fontWeight: '600' }}>₹{Number(val).toLocaleString()}</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Stores', value: items.length, icon: <Icons.Store />, color: 'primary' },
                { label: 'Total Revenue', value: `₹${items.reduce((sum, i) => sum + Number(i.total_revenue), 0).toLocaleString()}`, icon: <Icons.Activity />, color: 'success' },
                { label: 'Top Store', value: items.sort((a, b) => b.total_revenue - a.total_revenue)[0]?.store_code || 'N/A', icon: <Icons.Zap />, color: 'warning' },
                { label: 'Avg Store Rev', value: items.length ? `₹${(items.reduce((sum, i) => sum + Number(i.total_revenue), 0) / items.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₹0', icon: <Icons.TrendingUp />, color: 'info' }
            ]
        },
        'owner-top-revenue-products': {
            title: 'Top Revenue Products',
            description: 'Comprehensive analytics on products generating the most revenue across all locations.',
            api: reportApi.getOwnerTopRevenueProductsReport,
            icon: <Icons.DollarSign size={24} />,
            extraFilters: [
                {
                    label: 'Store',
                    key: 'storeId',
                    options: storeOptions
                }
            ],
            columns: [
                {
                    title: 'Product Details',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Items Sold',
                    key: 'total_sold',
                    render: (val) => (
                        <span style={{ fontWeight: '600' }}>
                            {val} Units
                        </span>
                    )
                },
                {
                    title: 'Total Revenue',
                    key: 'total_revenue',
                    render: (val) => <span className="badge-code text-success" style={{ fontWeight: '600' }}>₹{Number(val).toLocaleString()}</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Products', value: items.length, icon: <Icons.Package />, color: 'primary' },
                { label: 'Network Revenue', value: `₹${items.reduce((sum, i) => sum + Number(i.total_revenue), 0).toLocaleString()}`, icon: <Icons.TrendingUp />, color: 'success' },
                { label: 'Top Product', value: items.sort((a, b) => b.total_revenue - a.total_revenue)[0]?.product_name || 'N/A', icon: <Icons.Zap />, color: 'warning' },
                { label: 'Total Units Sold', value: items.reduce((sum, i) => sum + Number(i.total_sold), 0).toLocaleString(), icon: <Icons.ShoppingCart />, color: 'info' }
            ]
        },
        'owner-top-selling-products': {
            title: 'Top Selling Products',
            description: 'Identify highest volume products sold throughout your entire retail network.',
            api: reportApi.getOwnerTopSellingProductsReport,
            icon: <Icons.TrendingUp size={24} />,
            extraFilters: [
                {
                    label: 'Store',
                    key: 'storeId',
                    options: storeOptions
                }
            ],
            columns: [
                {
                    title: 'Product Details',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Total Items Sold',
                    key: 'total_sold',
                    render: (val) => (
                        <span className="badge-code text-success" style={{ fontWeight: '600' }}>
                            {val} Units
                        </span>
                    )
                },
                {
                    title: 'Total Revenue',
                    key: 'total_revenue',
                    render: (val) => <span style={{ fontWeight: '600' }}>₹{Number(val).toLocaleString()}</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Products', value: items.length, icon: <Icons.Package />, color: 'primary' },
                { label: 'Network Volume', value: `${items.reduce((sum, i) => sum + Number(i.total_sold), 0).toLocaleString()} Units`, icon: <Icons.ShoppingCart />, color: 'success' },
                { label: 'Best Seller', value: items.sort((a, b) => b.total_sold - a.total_sold)[0]?.product_name || 'N/A', icon: <Icons.Zap />, color: 'warning' },
                { label: 'Network Revenue', value: `₹${items.reduce((sum, i) => sum + Number(i.total_revenue), 0).toLocaleString()}`, icon: <Icons.TrendingUp />, color: 'info' }
            ]
        },
        'owner-stock': {
            title: 'Consolidated Stock',
            description: 'Real-time inventory levels across all your stores and warehouses in a single view.',
            api: reportApi.getOwnerStockReport,
            icon: <Icons.Stock size={24} />,
            hideTimeFilter: true,
            extraFilters: [
                {
                    label: 'Location',
                    key: 'locationParams',
                    options: locationOptions
                }
            ],
            columns: [
                {
                    title: 'Item Description',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Location',
                    key: 'location_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span style={{ fontWeight: 500 }}>{val}</span>
                            <small className="table-secondary-text">{record.location_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Current Holdings',
                    key: 'quantity',
                    render: (val, record) => {
                        const isLow = Number(val) > 0 && Number(val) <= Number(record.min_stock);
                        const isOut = Number(val) === 0;
                        return (
                            <span className={`badge-code ${isOut ? 'text-danger' : isLow ? 'text-warning' : 'text-success'}`}>
                                {val} Units
                            </span>
                        );
                    }
                },
                {
                    title: 'Unit Price',
                    key: 'price',
                    render: (val) => <span>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Total Value',
                    key: 'total_value',
                    render: (_, record) => <span style={{ fontWeight: 600 }}>₹{(Number(record.quantity) * Number(record.price)).toLocaleString()}</span>
                },
                {
                    title: 'Minimum Threshold',
                    key: 'min_stock',
                    render: (val) => <span>{val} Units</span>
                }
            ],
            calcStats: (items) => [
                { label: 'Total Listings', value: items.length, icon: <Icons.Layers />, color: 'primary' },
                { label: 'Inventory Units', value: items.reduce((sum, i) => sum + Number(i.quantity), 0).toLocaleString(), icon: <Icons.Boxes />, color: 'success' },
                { label: 'Locations Tracked', value: new Set(items.map(i => i.location_name)).size, icon: <Icons.Store />, color: 'info' },
                { label: 'Asset Value', value: `₹${items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.price)), 0).toLocaleString()}`, icon: <Icons.Banknote />, color: 'warning' }
            ]
        },
        'owner-invoices': {
            title: 'Consolidated Invoices',
            description: 'Full history of invoices processed across all your stores with filtering capabilities.',
            api: reportApi.getOwnerInvoicesReport,
            icon: <Icons.Invoice size={24} />,
            extraFilters: [
                {
                    label: 'Store',
                    key: 'storeId',
                    options: storeOptions
                }
            ],
            columns: [
                {
                    title: 'Invoice Details',
                    key: 'invoice_no',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">{record.invoice_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Store Name',
                    key: 'store_name',
                    render: (val) => <span style={{ fontWeight: 500, color: 'var(--primary-main)' }}>{val}</span>
                },
                {
                    title: 'Staff / Customer',
                    key: 'cashier_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span>{val} (Staff)</span>
                            <small className="table-secondary-text">{record.customer_name || 'Walk-in'}</small>
                        </div>
                    )
                },
                {
                    title: 'Grand Total',
                    key: 'grand_total',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Date',
                    key: 'created_at',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Network Invoices', value: items.length, icon: <Icons.FileText />, color: 'primary' },
                { label: 'Global Sales', value: `₹${items.reduce((sum, i) => sum + Number(i.grand_total), 0).toLocaleString()}`, icon: <Icons.TrendingUp />, color: 'success' },
                { label: 'Active Stores', value: new Set(items.map(i => i.store_name)).size, icon: <Icons.Store />, color: 'info' },
                { label: 'Avg Network Invoice', value: items.length ? `₹${(items.reduce((sum, i) => sum + Number(i.grand_total), 0) / items.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₹0', icon: <Icons.Activity />, color: 'warning' }
            ]
        },
        'owner-payments': {
            title: 'Consolidated Payments',
            description: 'Complete log of payments collected across all your retail locations.',
            api: reportApi.getOwnerPaymentsReport,
            icon: <Icons.Banknote size={24} />,
            extraFilters: [
                {
                    label: 'Store',
                    key: 'storeId',
                    options: storeOptions
                }
            ],
            columns: [
                {
                    title: 'Payment Details',
                    key: 'method_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val || 'N/A'}</span>
                            <small className="table-secondary-text">{record.payment_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Store',
                    key: 'store_name',
                    render: (val) => <span style={{ fontWeight: 500, color: 'var(--primary-main)' }}>{val}</span>
                },
                {
                    title: 'Invoice No',
                    key: 'invoice_no',
                    render: (val) => <span style={{ fontWeight: 600 }}>{val}</span>
                },
                {
                    title: 'Amount',
                    key: 'amount',
                    render: (val) => <span style={{ fontWeight: 600 }}>₹{Number(val).toLocaleString()}</span>
                },
                {
                    title: 'Date',
                    key: 'payment_date',
                    render: (val) => new Date(val).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                }
            ],
            calcStats: (items) => [
                { label: 'Network Payments', value: items.length, icon: <Icons.Activity />, color: 'info' },
                { label: 'Global Collections', value: `₹${items.reduce((sum, i) => sum + Number(i.amount), 0).toLocaleString()}`, icon: <Icons.Banknote />, color: 'primary' },
                { label: 'Store Coverage', value: new Set(items.map(i => i.store_name)).size, icon: <Icons.Store />, color: 'warning' },
                { label: 'Avg Collection', value: items.length ? `₹${(items.reduce((sum, i) => sum + Number(i.amount), 0) / items.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₹0', icon: <Icons.CheckCircle />, color: 'success' }
            ]
        },
        'owner-low-stock': {
            title: 'Low Stock Alerts',
            description: 'Critical monitoring of products falling below minimum stock levels in any location.',
            api: reportApi.getOwnerLowStockReport,
            icon: <Icons.Activity size={24} />,
            hideTimeFilter: true,
            columns: [
                {
                    title: 'Item Identity',
                    key: 'product_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="table-secondary-text">SKU: {record.sku}</small>
                        </div>
                    )
                },
                {
                    title: 'Location Context',
                    key: 'location_name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span style={{ fontWeight: 500 }}>{val}</span>
                            <small className="table-secondary-text">{record.location_type}</small>
                        </div>
                    )
                },
                {
                    title: 'Warning Level',
                    key: 'quantity',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="badge-code text-danger" style={{ fontWeight: '600' }}>{val} Units Left</span>
                            <small className="table-secondary-text">Threshold: {record.min_stock}</small>
                        </div>
                    )
                }
            ],
            calcStats: (items) => [
                { label: 'Critical Alerts', value: items.length, icon: <Icons.AlertCircle />, color: 'danger' },
                { label: 'Stores Affected', value: new Set(items.filter(i => i.location_type === 'Store').map(i => i.location_name)).size, icon: <Icons.Store />, color: 'primary' },
                { label: 'Warehouses Affected', value: new Set(items.filter(i => i.location_type === 'Warehouse').map(i => i.location_name)).size, icon: <Icons.Warehouse />, color: 'warning' },
                { label: 'Unique SKUs', value: new Set(items.map(i => i.sku)).size, icon: <Icons.Package />, color: 'info' }
            ]
        },
        'owner-locations': {
            title: 'Locations Overview',
            description: 'Quick status summary of all your stores and warehouses.',
            api: reportApi.getOwnerLocations,
            icon: <Icons.Layers size={24} />,
            hideTimeFilter: true,
            columns: [
                {
                    title: 'Type',
                    key: 'type',
                    render: (val) => (
                        <span style={{ textTransform: 'capitalize' }}>
                            {val}
                        </span>
                    )
                },
                {
                    title: 'Location Identity',
                    key: 'name',
                    render: (val, record) => (
                        <div className="table-info-group">
                            <span className="table-name-cell">{val}</span>
                            <small className="badge-code" style={{ padding: 0 }}>{record.code}</small>
                        </div>
                    )
                },
                {
                    title: 'City',
                    key: 'location',
                    render: (val) => val || 'N/A'
                },
                {
                    title: 'Status',
                    key: 'is_active',
                    render: (val) => (
                        <span className={`status-pill ${val ? 'active' : 'inactive'}`}>
                            {val ? 'Operational' : 'Closed'}
                        </span>
                    )
                }
            ],
            calcStats: (items) => [
                { label: 'Total Properties', value: items.length, icon: <Icons.Layers />, color: 'primary' },
                { label: 'Active Stores', value: items.filter(i => i.type === 'Store' && i.is_active).length, icon: <Icons.Store />, color: 'success' },
                { label: 'Active Warehouses', value: items.filter(i => i.type === 'Warehouse' && i.is_active).length, icon: <Icons.Warehouse />, color: 'info' },
                { label: 'Unique Cities', value: new Set(items.map(i => i.location)).size, icon: <Icons.Location />, color: 'warning' }
            ]
        }
    };

    const config = reportConfigs[reportId];

    useEffect(() => {
        // Reset extra filter ONLY when changing the entire report type
        setFilterValues({});
        setTimeRange('all');
        setSearchQuery('');
    }, [reportId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 300); // 300ms debounce
        return () => clearTimeout(timer);
    }, [reportId, timeRange, selectedDate, selectedMonth, selectedYear, customRange, filterValues, searchQuery]);

    useEffect(() => {
        if (reportId === 'manager-invoices' || reportId === 'manager-payments') {
            fetchStaff();
        }
        if (reportId.startsWith('owner-')) {
            fetchLocations();
        }
    }, [reportId]);

    const fetchLocations = async () => {
        try {
            const res = await reportApi.getOwnerLocations();
            if (res.data) {
                const locOptions = [
                    { value: 'all', label: 'All My Locations' },
                    ...res.data.map(loc => ({
                        value: `${loc.id}:${loc.type}`,
                        label: `${loc.name} (${loc.type})`
                    }))
                ];
                setLocationOptions(locOptions);

                const sOptions = [
                    { value: 'all', label: 'All My Stores' },
                    ...res.data.filter(loc => loc.type === 'Store').map(loc => ({
                        value: loc.id,
                        label: loc.name
                    }))
                ];
                setStoreOptions(sOptions);
            }
        } catch (error) {
            console.error('Error fetching locations:', error);
        }
    };

    const fetchStaff = async () => {
        try {
            const res = await reportApi.getStoreStaff();
            if (res.data) {
                const options = [
                    { value: 'all', label: 'All Cashiers' },
                    ...res.data.map(u => ({ value: u.id, label: u.name }))
                ];
                setStaffOptions(options);
            }
        } catch (error) {
            console.error('Error fetching staff:', error);
        }
    };


    const handleReset = () => {
        setTimeRange('all');
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSelectedMonth(new Date().toISOString().slice(0, 7));
        setSelectedYear(new Date().getFullYear().toString());
        setCustomRange({ start: '', end: '' });
        setFilterValues({});
        setSearchQuery('');
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            let params = {};

            if (searchQuery) {
                params.search = searchQuery;
            }

            if (timeRange !== 'all') {
                const now = new Date();
                let start = null;
                const endOfDay = new Date(now);
                endOfDay.setHours(23, 59, 59, 999);
                let end = endOfDay.toISOString();

                switch (timeRange) {
                    case 'currentDay': {
                        const d = new Date(now);
                        d.setHours(0, 0, 0, 0);
                        start = d.toISOString();
                        break;
                    }
                    case 'currentWeek': {
                        const d = new Date(now);
                        const dayOfWeek = d.getDay();
                        const diff = d.getDate() - dayOfWeek;
                        d.setDate(diff);
                        d.setHours(0, 0, 0, 0);
                        start = d.toISOString();
                        break;
                    }
                    case 'currentMonth': {
                        const d = new Date(now);
                        start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
                        break;
                    }
                    case 'currentYear': {
                        const d = new Date(now);
                        start = new Date(d.getFullYear(), 0, 1).toISOString();
                        break;
                    }
                    case 'selectDay': {
                        if (selectedDate) {
                            const d = new Date(selectedDate);
                            d.setHours(0, 0, 0, 0);
                            start = d.toISOString();
                            const e = new Date(selectedDate);
                            e.setHours(23, 59, 59, 999);
                            end = e.toISOString();
                        } else {
                            setLoading(false);
                            return;
                        }
                        break;
                    }
                    case 'selectMonth': {
                        if (selectedMonth) {
                            const [year, month] = selectedMonth.split('-').map(Number);
                            start = new Date(year, month - 1, 1).toISOString();
                            end = new Date(year, month, 0, 23, 59, 59, 999).toISOString();
                        } else {
                            setLoading(false);
                            return;
                        }
                        break;
                    }
                    case 'selectYear': {
                        if (selectedYear) {
                            start = new Date(Number(selectedYear), 0, 1).toISOString();
                            end = new Date(Number(selectedYear), 11, 31, 23, 59, 59, 999).toISOString();
                        } else {
                            setLoading(false);
                            return;
                        }
                        break;
                    }
                    case 'last7': {
                        const d = new Date(now);
                        d.setDate(d.getDate() - 7);
                        d.setHours(0, 0, 0, 0);
                        start = d.toISOString();
                        break;
                    }
                    case 'last30': {
                        const d = new Date(now);
                        d.setDate(d.getDate() - 30);
                        d.setHours(0, 0, 0, 0);
                        start = d.toISOString();
                        break;
                    }
                    case 'last365': {
                        const d = new Date(now);
                        d.setDate(d.getDate() - 365);
                        d.setHours(0, 0, 0, 0);
                        start = d.toISOString();
                        break;
                    }
                    case 'custom': {
                        if (customRange.start && customRange.end) {
                            const s = new Date(customRange.start);
                            s.setHours(0, 0, 0, 0);
                            start = s.toISOString();

                            const e = new Date(customRange.end);
                            e.setHours(23, 59, 59, 999);
                            end = e.toISOString();
                        } else {
                            setLoading(false);
                            return;
                        }
                        break;
                    }
                    default:
                        start = null;
                }

                if (start) params = { ...params, startDate: start, endDate: end };
            }

            if (config?.sortBy) {
                params.sortBy = config.sortBy;
            }

            if (config?.extraFilters) {
                config.extraFilters.forEach(filter => {
                    const val = filterValues[filter.key] || 'all';
                    if (val !== 'all' && filter.key !== 'intakeType') {
                        if (filter.key === 'locationParams') {
                            const [id, type] = val.split(':');
                            params.locationId = id;
                            params.locationType = type;
                        } else {
                            params[filter.key] = val;
                        }
                    }
                });
            }

            const result = await reportConfigs[reportId].api(params);

            if (result.data && !Array.isArray(result.data) && result.data.rows) {
                setData(result.data.rows);
                setReportMetadata(result.data);
            } else {
                setData(result.data || []);
                setReportMetadata({});
            }
        } catch (error) {
            console.error('Error fetching report data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        if (!data || !config?.extraFilters) return data;

        let result = [...data];
        config.extraFilters.forEach(filter => {
            const val = filterValues[filter.key] || 'all';
            if (val === 'all') return;

            if (filter.key === 'intakeType') {
                if (val === 'manual') {
                    result = result.filter(i => !i.method_name?.toLowerCase()?.includes('razor'));
                } else if (val === 'digital') {
                    result = result.filter(i => i.method_name?.toLowerCase()?.includes('razor'));
                }
            }
        });

        return result;
    }, [data, filterValues, config]);

    const stats = useMemo(() => {
        if (!config || !filteredData) return [];
        return config.calcStats(filteredData);
    }, [config, filteredData]);

    const handleExport = (type) => {
        const fileName = `${reportId}-analytics-${new Date().toISOString().split('T')[0]}`;
        const exportData = filteredData.map(item => {
            const flatObj = {};

            // Add SKU at the beginning if present in the data item
            if (item.sku) {
                flatObj['SKU'] = item.sku;
            }

            config.columns.forEach(col => {
                const rawVal = item[col.key];
                flatObj[col.title] = col.key === 'is_active' ? (rawVal ? 'Active' : 'Inactive') :
                    ((col.key === 'created_at' || col.key === 'payment_date') ? new Date(rawVal).toLocaleDateString() : rawVal);
            });
            return flatObj;
        });

        if (type === 'csv') ExportUtils.exportToCSV(exportData, fileName);
        if (type === 'excel') ExportUtils.exportToExcel(exportData, fileName);
        if (type === 'pdf') ExportUtils.exportToPDF(exportData, config.title, fileName);
    };

    if (!config) return null;

    return (
        <MainLayout>
            <div className="reports-container">
                {/* Premium Header */}
                <div className="report-header-premium">
                    <div className="report-title-row">
                        <div className="report-title-group">
                            <h1>{config.title}</h1>
                            <p className="sub-text">{config.description}</p>
                        </div>
                        <div className="export-group" style={{ gap: '24px' }}>
                            <Button style={{ margin: 2 }} variant="outline" size="small" onClick={() => handleExport('pdf')}>
                                <Icons.FileText size={16} style={{ marginRight: '2px' }} /> PDF
                            </Button>
                            <Button style={{ margin: 2 }} variant="outline" size="small" onClick={() => handleExport('excel')}>
                                <Icons.Excel size={16} style={{ marginRight: '2px' }} /> Excel
                            </Button>
                            <Button style={{ margin: 2 }} variant="outline" size="small" onClick={() => handleExport('csv')}>
                                <Icons.Download size={16} style={{ marginRight: '2px' }} /> CSV
                            </Button>
                        </div>
                    </div>
                </div>

                {/* ADVANCED CONTROL BAR (Now At The Top) */}
                <div className="report-control-bar">
                    {!config.hideTimeFilter && (
                        <div className="control-section">
                            <span className="filter-label"><Icons.Filter size={16} /> Time Range:</span>
                            <select
                                className="filter-main-select"
                                value={timeRange}
                                onChange={(e) => setTimeRange(e.target.value)}
                            >
                                <option value="all">All Time</option>
                                <option value="currentDay">Current Day</option>
                                <option value="currentWeek">Current Week</option>
                                <option value="currentMonth">Current Month</option>
                                <option value="currentYear">Current Year</option>
                                <option value="last7">Last 7 Days</option>
                                <option value="last30">Last 30 Days</option>
                                <option value="last365">Last 365 Days</option>
                                <option value="selectDay">Select Day</option>
                                <option value="selectMonth">Select Month</option>
                                <option value="selectYear">Select Year</option>
                                <option value="custom">Custom Range</option>
                            </select>

                            {/* Supplementary Inputs based on selection */}
                            <div className="filter-supplementary">
                                {timeRange === 'selectDay' && (
                                    <div className="filter-input-wrapper">
                                        <input
                                            type="date"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        />
                                    </div>
                                )}

                                {timeRange === 'selectMonth' && (
                                    <div className="filter-input-wrapper">
                                        <input
                                            type="month"
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                        />
                                    </div>
                                )}

                                {timeRange === 'selectYear' && (
                                    <div className="filter-input-wrapper">
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(e.target.value)}
                                        >
                                            {Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                <option key={year} value={year}>{year}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {timeRange === 'custom' && (
                                    <>
                                        <div className="filter-input-wrapper">
                                            <input
                                                type="date"
                                                value={customRange.start}
                                                onChange={(e) => setCustomRange({ ...customRange, start: e.target.value })}
                                            />
                                        </div>
                                        <Icons.Forward size={14} color="var(--gray-300)" />
                                        <div className="filter-input-wrapper">
                                            <input
                                                type="date"
                                                value={customRange.end}
                                                min={customRange.start}
                                                onChange={(e) => setCustomRange({ ...customRange, end: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {config.extraFilters && config.extraFilters.map(filter => (
                        <div key={filter.key} className="control-section">
                            <span className="filter-label"><Icons.Filter size={16} /> {filter.label}:</span>
                            <select
                                className="filter-main-select"
                                value={filterValues[filter.key] || 'all'}
                                onChange={(e) => setFilterValues({ ...filterValues, [filter.key]: e.target.value })}
                            >
                                {filter.options.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                    ))}

                    {!config.hideSearch && (
                        <div className="control-section" style={{ minWidth: '260px' }}>
                            <div className="filter-input-wrapper search-wrapper" style={{ width: '100%' }}>
                                <Icons.Search size={16} className="search-icon" />
                                <input
                                    type="text"
                                    placeholder={
                                        reportId.includes('stores') || reportId.includes('locations') ? "Search by Store Name or Code..." :
                                            reportId.includes('invoices') || reportId.includes('payments') ? "Search by Invoice No or Customer..." :
                                                "Search by Product or SKU..."
                                    }
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    style={{ width: '100%', paddingLeft: '32px' }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="control-section" style={{ marginLeft: 'auto', gap: '4px' }}>
                        <Button variant="ghost" size="small" onClick={handleReset} title="Reset All Filters">
                            <Icons.XCircle size={20} />
                        </Button>
                        <Button variant="ghost" size="small" onClick={fetchData} title="Refresh Data">
                            <Icons.Refresh size={20} />
                        </Button>
                    </div>
                </div>

                {/* Summary Stats Grid (Now Below Filter) */}
                <div className="report-stats-grid">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="report-stat-card">
                            <div className="stat-label">{stat.label}</div>
                            <div className={`stat-value-row text-${stat.color}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                                {stat.icon}
                                <div className="stat-value" style={{ color: 'var(--gray-900)' }}>{loading ? '...' : stat.value}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Premium Table Card */}
                <Card className="premium-table-card">
                    {loading ? (
                        <div className="page-loading" style={{ minHeight: '300px' }}>
                            <Loader size="large" />
                            <p className="mt-16">Filtering your data...</p>
                        </div>
                    ) : data.length > 0 ? (
                        <Table
                            columns={config.columns}
                            data={filteredData}
                            itemsPerPage={10}
                            searchable={false}
                            enableDefaultSort={false}
                        />
                    ) : (
                        <EmptyState
                            icon={config.icon}
                            title="No Results Matching Filter"
                            description="Adjust your time range or try different selection parameters."
                            action={<Button onClick={() => setTimeRange('all')}>Reset to All Time</Button>}
                        />
                    )}
                </Card>
            </div>
        </MainLayout>
    );
};

export default ReportDetail;
