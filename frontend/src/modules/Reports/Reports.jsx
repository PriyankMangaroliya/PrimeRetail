import React from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Icons from '../../components/common/Icons';
import { useAuth } from '../../context/AuthContext';

const Reports = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Define reports based on roles
    const superAdminReports = [
        {
            id: 'store-owners',
            name: 'Store Owners Report',
            description: 'List of all store owners with their store and warehouse counts.',
            icon: <Icons.Users size={32} />,
            url: '/admin/reports/store-owners'
        },
        {
            id: 'stores',
            name: 'Stores Report',
            description: 'Comprehensive list of all stores with their associated owners.',
            icon: <Icons.Store size={32} />,
            url: '/admin/reports/stores'
        },
        {
            id: 'warehouses',
            name: 'Warehouses Report',
            description: 'List of all warehouses in the system with owner details.',
            icon: <Icons.Warehouse size={32} />,
            url: '/admin/reports/warehouses'
        },
        {
            id: 'roles',
            name: 'Roles Report',
            description: 'Security overview of user roles and active platform utilization.',
            icon: <Icons.Shield size={32} />,
            url: '/admin/reports/roles'
        },
        {
            id: 'taxes',
            name: 'Global Taxes Report',
            description: 'Insight into active global tax configurations and localized deployment.',
            icon: <Icons.Receipt size={32} />,
            url: '/admin/reports/taxes'
        },
        {
            id: 'payment-methods',
            name: 'Payment Methods Report',
            description: 'Analytics on available POS and checkout payment infrastructures.',
            icon: <Icons.CreditCard size={32} />,
            url: '/admin/reports/payment-methods'
        }
    ];

    const warehouseStaffReports = [
        {
            id: 'warehouse-stock',
            name: 'Current Stock',
            description: 'Direct volume tracker of inventory capabilities and shortages.',
            icon: <Icons.Layers size={32} />,
            url: '/warehouse/reports/warehouse-stock'
        },
        {
            id: 'warehouse-transactions',
            name: 'Stock Transactions',
            description: 'Warehouse movement directions covering receipts and damages.',
            icon: <Icons.Activity size={32} />,
            url: '/warehouse/reports/warehouse-transactions'
        }
    ];
    const inventoryStaffReports = [
        {
            id: 'inventory-stock',
            name: 'Current Stock',
            description: 'Real-time tracking of product availability on the store floor.',
            icon: <Icons.Layers size={32} />,
            url: '/inventory/reports/inventory-stock'
        },
        {
            id: 'inventory-transactions',
            name: 'Stock Transactions',
            description: 'Chronological history of store movements including returns and exchanges.',
            icon: <Icons.Activity size={32} />,
            url: '/inventory/reports/inventory-transactions'
        }
    ];

    const cashierReports = [
        {
            id: 'cashier-invoices',
            name: 'Invoices',
            description: 'Listing of invoices processed by you, including totals and status.',
            icon: <Icons.Invoice size={32} />,
            url: '/cashier/reports/cashier-invoices'
        },
        {
            id: 'cashier-payments',
            name: 'Payments',
            description: 'Log of payments processed by you, categorized by method and status.',
            icon: <Icons.Currency size={32} />,
            url: '/cashier/reports/cashier-payments'
        }
    ];

    const storeManagerReports = [
        {
            id: 'manager-top-selling',
            name: 'Top Selling Products',
            description: 'Analytics on products with the highest sales volume across your store.',
            icon: <Icons.TrendingUp size={32} />,
            url: '/manager/reports/manager-top-selling'
        },
        {
            id: 'manager-top-revenue',
            name: 'Top Revenue Products',
            description: 'Analytics on products generating the most revenue for your store.',
            icon: <Icons.DollarSign size={32} />,
            url: '/manager/reports/manager-top-revenue'
        },
        {
            id: 'manager-stock',
            name: 'Store Stock',
            description: 'Real-time tracking of product availability and inventory levels across your store.',
            icon: <Icons.Stock size={32} />,
            url: '/manager/reports/manager-stock'
        },
        {
            id: 'manager-transactions',
            name: 'Inventory Transactions',
            description: 'Log of all stock movements in your store (Sales, Returns, Transfers).',
            icon: <Icons.Layers size={32} />,
            url: '/manager/reports/manager-transactions'
        },
        {
            id: 'manager-invoices',
            name: 'Store Invoices',
            description: 'All invoices processed in your store. Filter by cashier or date.',
            icon: <Icons.Invoice size={32} />,
            url: '/manager/reports/manager-invoices'
        },
        {
            id: 'manager-payments',
            name: 'Store Payments',
            description: 'Complete log of all payments collected in your store.',
            icon: <Icons.Banknote size={32} />,
            url: '/manager/reports/manager-payments'
        }
    ];

    const storeOwnerReports = [
        {
            id: 'owner-top-revenue-stores',
            name: 'Top Revenue Stores',
            description: 'Compare performance across all your stores based on total revenue generated.',
            icon: <Icons.Store size={32} />,
            url: '/owner/reports/owner-top-revenue-stores'
        },
        {
            id: 'owner-top-revenue-products',
            name: 'Top Revenue Products',
            description: 'Comprehensive analytics on products generating the most revenue across all locations.',
            icon: <Icons.DollarSign size={32} />,
            url: '/owner/reports/owner-top-revenue-products'
        },
        {
            id: 'owner-top-selling-products',
            name: 'Top Selling Products',
            description: 'Identify highest volume products sold throughout your entire retail network.',
            icon: <Icons.TrendingUp size={32} />,
            url: '/owner/reports/owner-top-selling-products'
        },
        {
            id: 'owner-stock',
            name: 'Consolidated Stock',
            description: 'Real-time inventory levels across all your stores and warehouses in a single view.',
            icon: <Icons.Stock size={32} />,
            url: '/owner/reports/owner-stock'
        },
        {
            id: 'owner-invoices',
            name: 'Consolidated Invoices',
            description: 'Full history of invoices processed across all your stores with filtering capabilities.',
            icon: <Icons.Invoice size={32} />,
            url: '/owner/reports/owner-invoices'
        },
        {
            id: 'owner-payments',
            name: 'Consolidated Payments',
            description: 'Complete log of payments collected across all your retail locations.',
            icon: <Icons.Banknote size={32} />,
            url: '/owner/reports/owner-payments'
        },
        {
            id: 'owner-low-stock',
            name: 'Low Stock Alerts',
            description: 'Critical monitoring of products falling below minimum stock levels in any location.',
            icon: <Icons.Activity size={32} />,
            url: '/owner/reports/owner-low-stock'
        },
        {
            id: 'owner-locations',
            name: 'Locations Overview',
            description: 'Quick status summary of all your stores and warehouses.',
            icon: <Icons.Layers size={32} />,
            url: '/owner/reports/owner-locations'
        }
    ];

    // Other roles reports can be added here
    const roleReports = {
        'Super Admin': superAdminReports,
        'Store Owner': storeOwnerReports,
        'Store Manager': storeManagerReports,
        'Inventory Staff': inventoryStaffReports,
        'Warehouse Staff': warehouseStaffReports,
        'Cashier': cashierReports
    };

    const currentReports = roleReports[user?.role_name] || [];

    return (
        <MainLayout>
            <div className="reports-container">
                <div className="page-header">
                    <div>
                        <h1>{user?.role_name} Reports</h1>
                        <p>Select a report to view details and export data.</p>
                    </div>
                </div>

                <div className="report-grid">
                    {currentReports.length > 0 ? (
                        currentReports.map((report) => (
                            <Card
                                key={report.id}
                                className="report-card"
                                onClick={() => navigate(report.url)}
                            >
                                <div className="report-card-content">
                                    <div className="report-card-icon">
                                        {report.icon}
                                    </div>
                                    <div className="report-card-info">
                                        <h3>{report.name}</h3>
                                        <p>{report.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="no-reports">
                            <p>No reports available for your role yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default Reports;
