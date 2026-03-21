import React, { useState, useEffect } from 'react';
import Icons from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import inventoryApi from '../../api/inventory.api';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import './Inventory.css';

const TransactionHistory = () => {
    const { user } = useAuth();

    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const res = await inventoryApi.getAllTransactions();
            let data = res.data || [];

            // Detect redirect query flags from the new Action Menu format to filter results
            const queryParams = new URLSearchParams(window.location.search);
            const targetProductId = queryParams.get('product_id');

            if (targetProductId) {
                data = data.filter(t => t.product_id && t.product_id.toString() === targetProductId);
            }

            setTransactions(data);
        } catch (error) {
            showAlert('danger', error.message || 'Failed to fetch transaction history');
        } finally {
            setLoading(false);
        }
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const getMovementBadge = (type) => {
        switch (type) {
            case 'Add': return <Badge variant="success">Add</Badge>;
            case 'Damaged': return <Badge variant="danger">Damaged</Badge>;
            case 'Return': return <Badge variant="info">Return</Badge>;
            case 'Exchange': return <Badge variant="orange">Exchange</Badge>;
            case 'By Mistake Add': return <Badge variant="secondary">By Mistake</Badge>;
            case 'Sell': return <Badge variant="primary">Sell</Badge>;
            case 'Transfer': return <Badge variant="purple">Transfer</Badge>;
            case 'Remove': return <Badge variant="dark">Remove</Badge>;
            case 'Others': return <Badge variant="light">Others</Badge>;
            default: return <Badge variant="secondary">{type}</Badge>;
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'id',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Product',
            key: 'product_name',
            className: 'table-name-cell'
        },
        {
            title: 'Movement Type',
            key: 'movement_type',
            render: (val) => getMovementBadge(val)
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (val, record) => {
                const isDecrease = ['Damaged', 'By Mistake Add', 'Sell', 'Remove', 'Transfer'].includes(record.movement_type);
                return (
                    <Badge variant={isDecrease ? 'danger' : 'success'}>
                        {isDecrease ? '-' : '+'}{val}
                    </Badge>
                );
            }
        },
        {
            title: 'Source',
            key: 'source_location_type',
            render: (_, record) => (
                record.source_location_type ? 
                <Badge variant={record.source_location_type === 'Warehouse' ? 'primary' : 'secondary'}>
                    {record.source_code || `${record.source_location_type} #${record.source_location_id}`}
                </Badge> : 
                <span className="text-gray-400">N/A</span>
            )
        },
        {
            title: 'Destination',
            key: 'destination_location_type',
            render: (_, record) => (
                record.destination_location_type ? 
                <Badge variant={record.destination_location_type === 'Warehouse' ? 'primary' : 'secondary'}>
                    {record.destination_code || `${record.destination_location_type} #${record.destination_location_id}`}
                </Badge> : 
                <span className="text-gray-400">N/A</span>
            )
        },
        {
            title: 'Reference',
            key: 'reference_type',
            render: (_, record) => (
                record.reference_type ? 
                <Badge variant="warning">{record.reference_type} #{record.reference_id}</Badge> : 
                <span className="text-gray-400">N/A</span>
            )
        },
        {
            title: 'Date',
            key: 'created_at',
            render: (val) => new Date(val).toLocaleDateString()
        }
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="inventory-loading">
                    <Loader size="large" />
                    <p>Loading transaction history...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="inventory-container">
                <header className="inventory-header">
                    <div className="header-info">
                        <h1>Transaction History</h1>
                        <p>Track all inventory movements, damages, and transfers</p>
                    </div>
                </header>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="inventory-table-card">
                    {transactions.length > 0 ? (
                        <Table
                            columns={columns}
                            data={transactions}
                            className="transactions-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Transactions"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.FileText size={48} />}
                            title="No Transactions Found"
                            description="There is no recorded history of stock transactions."
                        />
                    )}
                </Card>
            </div>
        </MainLayout>
    );
};

export default TransactionHistory;
