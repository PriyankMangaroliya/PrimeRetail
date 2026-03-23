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
        const typeUpper = type?.toUpperCase();
        switch (typeUpper) {
            case 'ADD': return <Badge variant="success">ADD</Badge>;
            case 'SELL': return <Badge variant="danger">SELL</Badge>;
            case 'RETURN': return <Badge variant="info">RETURN</Badge>;
            case 'EXCHANGE': return <Badge variant="orange">EXCHANGE</Badge>;
            case 'TRANSFER': return <Badge variant="purple">TRANSFER</Badge>;
            case 'DAMAGED': return <Badge variant="danger">DAMAGED</Badge>;
            case 'MANUAL_ADD': return <Badge variant="success">MANUAL_ADD</Badge>;
            case 'MANUAL_REMOVE': return <Badge variant="danger">MANUAL_REMOVE</Badge>;
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
            title: 'SKU',
            key: 'sku',
            render: (value) => <Badge variant="primary" className="badge-code">{value}</Badge>
        },
        {
            title: 'Movement',
            key: 'movement_type',
            render: (val) => getMovementBadge(val)
        },
        {
            title: 'Quantity',
            key: 'quantity',
            render: (val, record) => {
                const typeUpper = record.movement_type?.toUpperCase();
                let isDecrease = ['SELL', 'DAMAGED', 'MANUAL_REMOVE'].includes(typeUpper);
                let isIncrease = ['ADD', 'RETURN', 'EXCHANGE', 'MANUAL_ADD'].includes(typeUpper);

                if (typeUpper === 'EXCHANGE') {
                    if (record.after_qty > record.before_qty) {
                        isIncrease = true; // Old product returned (+)
                    } else if (record.after_qty < record.before_qty) {
                        isDecrease = true; // New product issued (-)
                    }
                }

                if (typeUpper === 'TRANSFER') {
                    const userLocType = user?.role_name === 'Warehouse Staff' ? 'Warehouse' : 'Store';
                    const userLocId = user?.role_name === 'Warehouse Staff' ? user.warehouse_id : user.store_id;

                    if (record.source_location_type === userLocType && record.source_location_id === userLocId) {
                        isDecrease = true;
                    } else if (record.destination_location_type === userLocType && record.destination_location_id === userLocId) {
                        isIncrease = true;
                    }
                }

                return (
                    <Badge variant={isDecrease ? 'danger' : 'success'} className="fw-bold">
                        {isDecrease ? '-' : isIncrease ? '+' : ''}{val}
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
            key: 'reference_id',
            render: (_, record) => (
                record.reference_id ?
                    <Badge variant="warning">{record.reference_type || 'REF'} #{record.reference_id}</Badge> :
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
                <div className="page-loading">
                    <Loader size="large" />
                    <p>Loading transactions...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="inventory-container">
                <header className="page-header">
                    <div>
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
