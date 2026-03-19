import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import './Dashboard.css';

const SuperAdminDashboard = () => {
    const revenueData = [
        { month: 'Jan', amount: 675 },
        { month: 'Feb', amount: 1587 },
        { month: 'Mar', amount: 45965 },
        { month: 'Apr', amount: 675 },
        { month: 'May', amount: 1587 },
        { month: 'Jun', amount: 45965 },
    ];

    return (
        <MainLayout>
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>Super Admin Dashboard</h1>
                    <p>Welcome back, Super Admin! Here's your system overview.</p>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Store size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Stores</h3>
                            <p className="stat-value">24</p>
                            <Badge variant="success">+3 this month</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Users size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Users</h3>
                            <p className="stat-value">156</p>
                            <Badge variant="success">+12 this month</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.DollarSign size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Revenue</h3>
                            <p className="stat-value">$1.2M</p>
                            <Badge variant="success">+18%</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Package size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Products</h3>
                            <p className="stat-value">5,678</p>
                            <Badge variant="warning">+234 this month</Badge>
                        </div>
                    </Card>
                </div>

                {/* Revenue Chart */}
                <Card className="revenue-chart">
                    <div className="chart-header">
                        <h3>Revenue Overview</h3>
                        <div className="chart-actions">
                            <Button variant="outline" size="small">Weekly</Button>
                            <Button variant="outline" size="small">Monthly</Button>
                            <Button variant="outline" size="small">Yearly</Button>
                        </div>
                    </div>

                    <div className="chart-container">
                        <div className="chart-bars">
                            {revenueData.map((item, index) => (
                                <div key={index} className="chart-bar-item">
                                    <div className="bar-container">
                                        <div
                                            className="bar"
                                            style={{
                                                height: `${Math.min((item.amount / 50000) * 200, 200)}px`,
                                                background: index === 2 || index === 5 ? 'var(--primary-color)' : 'var(--gray-400)'
                                            }}
                                        ></div>
                                    </div>
                                    <span className="month-label">{item.month}</span>
                                    <span className="amount-label">${item.amount.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>

                {/* Recent Activity */}
                <Card className="recent-activity">
                    <h3>Recent System Activity</h3>
                    <div className="activity-list">
                        {[1,2,3,4,5].map((item) => (
                            <div key={item} className="activity-item">
                                <div className="activity-icon"><Icons.Bell size={18} /></div>
                                <div className="activity-details">
                                    <p className="activity-text">New store "Downtown Store" was created</p>
                                    <span className="activity-time">2 minutes ago</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default SuperAdminDashboard;