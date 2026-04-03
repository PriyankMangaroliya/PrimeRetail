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
import { useAuth } from "../../context/AuthContext.jsx";


const Payments = () => {
    const { user } = useAuth();
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ show: false, type: '', message: '' });
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedPayment, setSelectedPayment] = useState(null);

    const isOwner = user?.role_name === 'Store Owner';

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
            default: return <Badge variant="success">{status}</Badge>;
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
        ...(isOwner ? [{
            title: 'Store Code',
            key: 'store_code',
            render: (value) => <Badge variant="primary" className="badge-code">{value}</Badge>
        }] : []),
        {
            title: 'Amount',
            key: 'amount',
            render: (val) => <span className="fw-bold">₹{parseFloat(val).toFixed(2)}</span>
        },
        {
            title: 'Method',
            key: 'method_name'
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
                <div className="page-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="payments-container">
                <div className="page-header">
                    <div>
                        <h1>Payment Records</h1>
                        <p>Track all received payments and transaction statuses</p>
                    </div>
                </div>

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
                            className="common-table"
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
                        footer={<Button variant="outline" onClick={() => setShowViewModal(false)}>Close</Button>}
                    >
                        <div className="detail-view-container">
                            <div className="detail-main-info">
                                <div className="detail-avatar-large">
                                    <Icons.DollarSign size={32} />
                                </div>
                                <div className="detail-title-group">
                                    <h2>{selectedPayment.invoice_no}</h2>
                                    <div className="detail-meta">
                                        {getStatusBadge(selectedPayment.method_name)}
                                    </div>
                                </div>
                            </div>

                            <div className="view-grid">
                                <div className="view-group">
                                    <label>Invoice Number</label>
                                    <p className="badge-code">{selectedPayment.invoice_no}</p>
                                </div>
                                <div className="view-group">
                                    <label>Store Code</label>
                                    <p>{selectedPayment.store_code}</p>
                                </div>
                                <div className="view-group">
                                    <label>Payment Date</label>
                                    <p>{new Date(selectedPayment.payment_date).toLocaleString()}</p>
                                </div>
                                <div className="view-group">
                                    <label>Payment Method</label>
                                    <p>{selectedPayment.method_name || 'NA'}</p>
                                </div>
                                <div className="view-group">
                                    <label>Transaction ID</label>
                                    <p>{selectedPayment.transaction_reference || 'N/A'}</p>
                                </div>
                                <div className="view-group">
                                    <label>Payment Status</label>
                                    <p>{selectedPayment.payment_status}</p>
                                </div>
                                <div className="view-group full-width">
                                    <div className="info-banner-flat">
                                        <span style={{ fontWeight: '500', color: 'var(--gray-600)' }}>Total Paid Amount</span>
                                        <span className="price-tag" style={{ fontSize: '1.5rem' }}>
                                            ₹{parseFloat(selectedPayment.amount).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Modal>
                )}
            </div>
        </MainLayout>
    );
};

export default Payments;
