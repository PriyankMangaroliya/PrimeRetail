import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import './Dashboard.css';

const InventoryStaffDashboard = () => {
    return (
        <MainLayout>
            <div className="dashboard">
                <div className="dashboard-header">
                    <h1>Inventory Management</h1>
                    <p>Track and manage store inventory</p>
                </div>

                {/* Inventory Stats */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.Package size={24} /></div>
                        <div className="stat-info">
                            <h3>Total Products</h3>
                            <p className="stat-value">1,234</p>
                            <Badge variant="success">+45 this week</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.AlertTriangle size={24} /></div>
                        <div className="stat-info">
                            <h3>Low Stock</h3>
                            <p className="stat-value">23</p>
                            <Badge variant="danger">Need reorder</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.ArrowDownCircle size={24} /></div>
                        <div className="stat-info">
                            <h3>Pending Receiving</h3>
                            <p className="stat-value">5</p>
                            <Badge variant="warning">Orders</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon"><Icons.ArrowUpCircle size={24} /></div>
                        <div className="stat-info">
                            <h3>To be Dispatched</h3>
                            <p className="stat-value">12</p>
                            <Badge variant="info">Ready to ship</Badge>
                        </div>
                    </Card>
                </div>

                {/* Low Stock Alert */}
                <Card className="low-stock">
                    <h3>Low Stock Alert</h3>
                    <table className="inventory-table">
                        <thead>
                        <tr>
                            <th>Product</th>
                            <th>SKU</th>
                            <th>Current Stock</th>
                            <th>Minimum Level</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {[1,2,3,4,5].map((item) => (
                            <tr key={item}>
                                <td>Product Name {item}</td>
                                <td>SKU-{item}234</td>
                                <td className="stock-low">5</td>
                                <td>20</td>
                                <td><Badge variant="danger">Critical</Badge></td>
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

export default InventoryStaffDashboard;