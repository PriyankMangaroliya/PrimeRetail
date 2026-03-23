import React, { useState, useEffect } from 'react';
import Icons from '../../components/common/Icons';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import paymentApi from '../../api/payment.api';
import Table from '../../components/common/Table/Table';
import Badge from '../../components/common/Badge/Badge';
import Alert from '../../components/common/Alert/Alert';
import Card from '../../components/common/Card/Card';
import Modal from '../../components/common/Modal/Modal';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import './Payments.css';

const Payments = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchPayments();
    }, []);

    const fetchPayments = async () => {
        try {
            setLoading(true);
            const res = await paymentApi.getAllPayments();
            setPayments(res.data.data || []);
        } catch (error) {
            showAlert('danger', error.message || 'Failed to fetch payment records');
        } finally {
            setLoading(false);
        }
    };

    const handleViewPayment = (payment) => {
        setSelectedPayment(payment);
        setShowViewModal(true);
    };

    const showAlert = (type, message) => {
        setAlert({ show: true, type, message });
        setTimeout(() => setAlert({ show: false, type: '', message: '' }), 5000);
    };

    const getStatusBadge = (status) => {
        const statusUpper = status?.toUpperCase();
        switch (statusUpper) {
            case 'COMPLETED': return <Badge variant="success">COMPLETED</Badge>;
            case 'PENDING': return <Badge variant="warning">PENDING</Badge>;
            case 'FAILED': return <Badge variant="danger">FAILED</Badge>;
            case 'REFUNDED': return <Badge variant="info">REFUNDED</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const columns = [
        {
            title: 'No',
            key: 'id',
            render: (_, __, index) => <span className="table-no-cell">{index + 1}</span>
        },
        {
            title: 'Invoice No',
            key: 'invoice_no',
            render: (value) => <Badge variant="primary" className="badge-code">{value}</Badge>
        },
        {
            title: 'Store Code',
            key: 'store_code'
        },
        {
            title: 'Amount',
            key: 'amount',
            render: (val) => <span className="fw-bold">₹{parseFloat(val).toFixed(2)}</span>
        },
        {
            title: 'Method',
            key: 'method_name',
            render: (val) => <Badge variant="info">{val || 'Cash'}</Badge>
        },
        {
            title: 'Status',
            key: 'payment_status',
            render: (val) => getStatusBadge(val)
        },
        {
            title: 'Date',
            key: 'payment_date',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <div className="common-action-menu" onClick={(e) => e.stopPropagation()}>
                    <button
                        className="action-trigger"
                        onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(activeDropdown === record.id ? null : record.id);
                        }}
                    >
                        <Icons.Actions size={16} />
                    </button>
                    {activeDropdown === record.id && (
                        <div className="action-dropdown">
                            <button className="action-item" onClick={() => { handleViewPayment(record); setActiveDropdown(null); }}>
                                <Icons.View size={16} /> View Details
                            </button>
                        </div>
                    )}
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <MainLayout>
                <div className="payments-loading">
                    <Loader size="large" />
                    <p>Loading payments...</p>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="payments-container">
                <header className="payments-header">
                    <div className="header-info">
                        <h1>Payment Records</h1>
                        <p>Track all received payments and transaction statuses</p>
                    </div>
                </header>

                {alert.show && (
                    <Alert type={alert.type} dismissible>
                        {alert.message}
                    </Alert>
                )}

                <Card className="payments-table-card">
                    {payments.length > 0 ? (
                        <Table
                            columns={columns}
                            data={payments}
                            className="payments-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Payments"
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.DollarSign size={48} />}
                            title="No Payments Found"
                            description="There are no recorded payment transactions."
                        />
                    )}
                </Card>

                {/* Payment Detail Modal */}
                {showViewModal && selectedPayment && (
                    <Modal
                        title="Payment Details"
                        isOpen={showViewModal}
                        onClose={() => setShowViewModal(false)}
                        footer={<Button onClick={() => setShowViewModal(false)}>Close</Button>}
                    >
                        <div className="payment-detail-view">
                            <div className="detail-header-section">
                                <div className="detail-icon-wrapper">
                                    <Icons.DollarSign size={32} />
                                </div>
                                <div className="detail-title-info">
                                    <h3>Invoice: {selectedPayment.invoice_no}</h3>
                                    <div className="detail-meta">
                                        Ref ID: #{selectedPayment.id} | {selectedPayment.store_code}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-grid">
                                <div className="detail-group">
                                    <label>Payment Date</label>
                                    <p>{new Date(selectedPayment.payment_date).toLocaleString()}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Payment Method</label>
                                    <p><Badge variant="info">{selectedPayment.method_name || 'Cash'}</Badge></p>
                                </div>
                                <div className="detail-group">
                                    <label>Transaction ID</label>
                                    <p className="badge-code">{selectedPayment.transaction_id || 'N/A'}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Status</label>
                                    <p>{getStatusBadge(selectedPayment.payment_status)}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Store Code</label>
                                    <p>{selectedPayment.store_code}</p>
                                </div>
                                <div className="detail-group">
                                    <label>Recorded By</label>
                                    <p>System User</p>
                                </div>
                            </div>

                            <div className="payment-amount-box">
                                <label>Total Paid Amount</label>
                                <div className="amount-val">₹{parseFloat(selectedPayment.amount).toFixed(2)}</div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </MainLayout>
    );
};

export default Payments;
