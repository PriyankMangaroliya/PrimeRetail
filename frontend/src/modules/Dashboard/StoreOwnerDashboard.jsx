import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import '../../styles/dashboard.css';

const StoreOwnerDashboard = () => {
    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Store Owner Dashboard</h1>
                        <p>Welcome back! Here's your store performance.</p>
                    </div>
                </div>

                {/* Store Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Store size={24} /></div>
                        <div className="stat-content">
                            <h3>My Stores</h3>
                            <p className="stat-value">3</p>
                            <Badge variant="success">All Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Users size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Staff</h3>
                            <p className="stat-value">45</p>
                            <Badge variant="success">+5 this month</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.DollarSign size={24} /></div>
                        <div className="stat-content">
                            <h3>Today's Revenue</h3>
                            <p className="stat-value">$12,450</p>
                            <Badge variant="success">+12%</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.BarChart size={24} /></div>
                        <div className="stat-content">
                            <h3>Monthly Revenue</h3>
                            <p className="stat-value">$248,697</p>
                            <Badge variant="success">+8.5%</Badge>
                        </div>
                    </Card>
                </div>

                {/* Store Performance */}
                <div className="stores-grid">
                    <Card className="store-card">
                        <h3>Downtown Store</h3>
                        <div className="store-metrics">
                            <div className="metric">
                                <span>Today's Sales</span>
                                <strong>$5,230</strong>
                            </div>
                            <div className="metric">
                                <span>Orders</span>
                                <strong>78</strong>
                            </div>
                            <div className="metric">
                                <span>Staff</span>
                                <strong>15</strong>
                            </div>
                        </div>
                        <Button variant="outline" size="small">View Details</Button>
                    </Card>

                    <Card className="store-card">
                        <h3>Mall Store</h3>
                        <div className="store-metrics">
                            <div className="metric">
                                <span>Today's Sales</span>
                                <strong>$4,890</strong>
                            </div>
                            <div className="metric">
                                <span>Orders</span>
                                <strong>65</strong>
                            </div>
                            <div className="metric">
                                <span>Staff</span>
                                <strong>18</strong>
                            </div>
                        </div>
                        <Button variant="outline" size="small">View Details</Button>
                    </Card>

                    <Card className="store-card">
                        <h3>Airport Store</h3>
                        <div className="store-metrics">
                            <div className="metric">
                                <span>Today's Sales</span>
                                <strong>$2,330</strong>
                            </div>
                            <div className="metric">
                                <span>Orders</span>
                                <strong>42</strong>
                            </div>
                            <div className="metric">
                                <span>Staff</span>
                                <strong>12</strong>
                            </div>
                        </div>
                        <Button variant="outline" size="small">View Details</Button>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default StoreOwnerDashboard;