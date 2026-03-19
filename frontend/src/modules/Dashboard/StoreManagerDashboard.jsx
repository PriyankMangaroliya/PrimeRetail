import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import './Dashboard.css';

const StoreManagerDashboard = () => {
    return (
        <MainLayout>
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>Store Manager Dashboard</h1>
                    <p>Manage your store operations efficiently.</p>
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
                    <table className="orders-table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Customer</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {[1,2,3,4,5].map((item) => (
                            <tr key={item}>
                                <td>#ORD-{1000 + item}</td>
                                <td>John Doe</td>
                                <td>$125.50</td>
                                <td><Badge variant="warning">Processing</Badge></td>
                                <td>
                                    <div className="action-buttons">
                                        <Button size="small" variant="outline" title="View"><Icons.View size={14} /></Button>
                                        <Button size="small" variant="outline" title="Status"><Icons.CheckCircle size={14} color="#10b981" /></Button>
                                        <Button size="small" variant="outline" title="Edit"><Icons.Edit size={14} /></Button>
                                        <Button size="small" variant="outline" title="Delete"><Icons.Trash size={14} /></Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </MainLayout>
    );
};

export default StoreManagerDashboard;