import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Table from '../../components/common/Table/Table';
import Icons from '../../components/common/Icons';
import './Dashboard.css';

const StoreManagerDashboard = () => {
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

    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Store Manager Dashboard</h1>
                        <p>Manage your store operations efficiently.</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.DollarSign size={24} /></div>
                        <div className="stat-info">
                            <h3>Today's Sales</h3>
                            <p className="stat-value">$5,230</p>
                            <Badge variant="success">+15%</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Package size={24} /></div>
                        <div className="stat-info">
                            <h3>Orders</h3>
                            <p className="stat-value">78</p>
                            <Badge variant="warning">12 Pending</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Users size={24} /></div>
                        <div className="stat-info">
                            <h3>Staff on Duty</h3>
                            <p className="stat-value">8/15</p>
                            <Badge variant="info">+2 in 1hr</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.AlertTriangle size={24} /></div>
                        <div className="stat-info">
                            <h3>Low Stock Items</h3>
                            <p className="stat-value">23</p>
                            <Badge variant="danger">Need reorder</Badge>
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