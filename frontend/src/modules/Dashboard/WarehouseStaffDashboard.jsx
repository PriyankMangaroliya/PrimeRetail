import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import '../../styles/dashboard.css';

const WarehouseStaffDashboard = () => {
    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Warehouse Operations</h1>
                        <p>Manage warehouse inventory and shipments</p>
                    </div>
                </div>

                {/* Warehouse Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Warehouse size={24} /></div>
                        <div className="stat-content">
                            <h3>Warehouse Capacity</h3>
                            <p className="stat-value">78%</p>
                            <Badge variant="success">12,450/16,000 units</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon info"><Icons.Package size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Items</h3>
                            <p className="stat-value">12,450</p>
                            <Badge variant="info">+234 today</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon warning"><Icons.ArrowDownCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>Incoming Shipments</h3>
                            <p className="stat-value">8</p>
                            <Badge variant="warning">Today</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.ArrowUpCircle size={24} /></div>
                        <div className="stat-content">
                            <h3>Outgoing Shipments</h3>
                            <p className="stat-value">15</p>
                            <Badge variant="success">Ready to dispatch</Badge>
                        </div>
                    </Card>
                </div>

                {/* Today's Tasks */}
                <div className="tasks-grid">
                    <Card className="tasks-card">
                        <h3>Receiving Tasks</h3>
                        <div className="task-list">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="task-item">
                                    <div className="task-info">
                                        <strong>PO-2024-{item}234</strong>
                                        <span>From: Supplier {item}</span>
                                        <span>Items: {item * 50}</span>
                                    </div>
                                    <Button size="small"><Icons.Zap size={14} style={{ marginRight: '4px' }} /> Start Receiving</Button>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="tasks-card">
                        <h3>Picking Tasks</h3>
                        <div className="task-list">
                            {[1, 2, 3, 4].map((item) => (
                                <div key={item} className="task-item">
                                    <div className="task-info">
                                        <strong>Order #WH-{item}45</strong>
                                        <span>Store: Downtown Store</span>
                                        <span>Items: {item * 15}</span>
                                    </div>
                                    <Button size="small"><Icons.Zap size={14} style={{ marginRight: '4px' }} /> Start Picking</Button>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default WarehouseStaffDashboard;