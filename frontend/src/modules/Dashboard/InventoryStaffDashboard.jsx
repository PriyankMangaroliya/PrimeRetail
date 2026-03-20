import React from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Table from '../../components/common/Table/Table';
import Icons from '../../components/common/Icons';
import './Dashboard.css';

const InventoryStaffDashboard = () => {
    const stockColumns = [
        {
            title: 'Product',
            key: 'name'
        },
        {
            title: 'SKU',
            key: 'sku'
        },
        {
            title: 'Current Stock',
            key: 'current',
            render: (val) => <span className="stock-low">{val}</span>
        },
        {
            title: 'Minimum Level',
            key: 'minimum'
        },
        {
            title: 'Status',
            key: 'status',
            render: (val) => <Badge variant="danger">{val}</Badge>
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

    const stockData = [1, 2, 3, 4, 5].map(i => ({
        id: i,
        name: `Product Name ${i}`,
        sku: `SKU-${i}234`,
        current: 5,
        minimum: 20,
        status: 'Critical'
    }));

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
                    <div className="inventory-table-container">
                        <Table
                            columns={stockColumns}
                            data={stockData}
                            searchable={false}
                            itemsPerPage={5}
                        />
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default InventoryStaffDashboard;