import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Table from '../../components/common/Table/Table';
import Icons from '../../components/common/Icons';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

const StoreManagerDashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        totalInvoices: 0,
        totalPayments: 0
    });
    const [loading, setLoading] = useState(true);

    const orderColumns = [
        {
            title: 'Order ID',
            key: 'id',
            render: (val) => `#ORD-${1000 + val}`
        },
        {
            title: 'Customer',
            key: 'customer'
        },
        {
            title: 'Amount',
            key: 'amount',
            render: (val) => `$${val.toFixed(2)}`
        },
        {
            title: 'Status',
            key: 'status',
            render: (val) => <Badge variant={val === 'Processing' ? 'warning' : 'success'}>{val}</Badge>
        },
        {
            title: 'Action',
            key: 'actions',
            render: () => (
                <div className="action-buttons">
                    <Button size="small" variant="outline" title="View"><Icons.View size={14} /></Button>
                    <Button size="small" variant="outline" title="Status"><Icons.CheckCircle size={14} color="#10b981" /></Button>
                    <Button size="small" variant="outline" title="Edit"><Icons.Edit size={14} /></Button>
                    <Button size="small" variant="outline" title="Delete"><Icons.Trash size={14} /></Button>
                </div>
            )
        }
    ];

    const recentOrders = [1, 2, 3, 4, 5].map(i => ({
        id: i,
        customer: 'John Doe',
        amount: 125.50,
        status: 'Processing'
    }));

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Store Manager Dashboard</h1>
                        <p>Manage your store operations efficiently.</p>
                    </div>
                    <Button onClick={fetchStats} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Package size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Products</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalProducts}</p>
                            <Badge variant="success">Catalog</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.BarChart size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stock</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalStock.toLocaleString()}</p>
                            <Badge variant="success">Available</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.FileText size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Invoices</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalInvoices}</p>
                            <Badge variant="info">Count</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.DollarSign size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Payments</h3>
                            <p className="stat-value">{loading ? '...' : `$${stats.totalPayments.toLocaleString()}`}</p>
                            <Badge variant="success">Revenue</Badge>
                        </div>
                    </Card>
                </div>

                {/* Recent Orders */}
                <Card className="recent-orders">
                    <div className="card-header">
                        <h3>Recent Orders</h3>
                        <Button variant="outline" size="small">View All</Button>
                    </div>
                    <div className="orders-table-container">
                        <Table
                            columns={orderColumns}
                            data={recentOrders}
                            className="dashboard-table"
                            searchable={false}
                            initialItemsPerPage={5}
                            itemName="Orders"
                        />
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default StoreManagerDashboard;