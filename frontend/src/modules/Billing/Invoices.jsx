import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import billingApi from '../../api/billing.api.js';
import Table from '../../components/common/Table/Table.jsx';
import Modal from '../../components/common/Modal/Modal.jsx';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Card from '../../components/common/Card/Card';
import Loader from '../../components/common/Loader/Loader';
import EmptyState from '../../components/common/EmptyState/EmptyState';
import Icons from '../../components/common/Icons';
import './Invoices.css';

const Invoices = () => {
    const { user } = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = () => setActiveDropdown(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const response = await billingApi.getAllInvoices();
            setInvoices(response.data.data || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = async (id) => {
        try {
            const response = await billingApi.getInvoiceById(id);
            setSelectedInvoice(response.data.data);
            setShowDetails(true);
        } catch (error) {
            console.error('Error fetching invoice details:', error);
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
            render: (val) => <Badge variant="primary" className="badge-code">{val}</Badge>
        },
        { 
            title: 'Date', 
            key: 'created_at',
            render: (val) => new Date(val).toLocaleDateString()
        },
        { title: 'Customer', key: 'customer_name', render: (val) => val || 'Walk-in Customer' },
        { title: 'Store Code', key: 'store_code' },
        { title: 'Total', key: 'grand_total', render: (val) => `₹${parseFloat(val).toFixed(2)}` },
        { 
            title: 'Type', 
            key: 'invoice_type',
            render: (val) => (
                <Badge variant={val?.toLowerCase() === 'retail' ? 'success' : 'info'}>
                    {val || 'RETAIL'}
                </Badge>
            )
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
                            <button className="action-item" onClick={() => { handleViewDetails(record.id); setActiveDropdown(null); }}>
                                <Icons.View size={16}/> View Details
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
                <div className="invoices-loading">
                    <Loader size="large" />
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <div className="invoices-container">
                <div className="page-header">
                    <div>
                        <h1>Invoices</h1>
                        <p>Track and manage all sales transactions</p>
                    </div>
                </div>

                <Card className="invoices-table-card">
                    {invoices.length > 0 ? (
                        <Table
                            columns={columns}
                            data={invoices}
                            className="invoices-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Invoices"
                            loading={loading}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.FileText size={48} />}
                            title="No Invoices Found"
                            description="There are no recorded sales invoices."
                        />
                    )}
                </Card>

            {/* Invoice Details Modal */}
            {showDetails && selectedInvoice && (
                <Modal
                    title={`Invoice Details`}
                    isOpen={showDetails}
                    onClose={() => setShowDetails(false)}
                    size="large"
                    footer={
                        <div className="modal-actions" style={{display: 'flex', gap: '12px'}}>
                            <Button variant="outline" onClick={() => setShowDetails(false)}>Close</Button>
                        </div>
                    }
                >
                    <div className="invoice-detail-view">
                        <div className="detail-header-section">
                            <div className="detail-icon-wrapper">
                                <Icons.FileText size={32} />
                            </div>
                            <div className="detail-title-info">
                                <h3>{selectedInvoice.invoice_no}</h3>
                                <div className="detail-meta">
                                    {new Date(selectedInvoice.created_at).toLocaleString()} | {selectedInvoice.store_code}
                                </div>
                            </div>
                        </div>

                        <div className="detail-grid">
                            <div className="detail-group">
                                <label>Invoice Type</label>
                                <p>{selectedInvoice.invoice_type || 'Retail'}</p>
                            </div>
                            <div className="detail-group">
                                <label>Cashier</label>
                                <p>{selectedInvoice.cashier_name}</p>
                            </div>
                            <div className="detail-group">
                                <label>Location</label>
                                <p>{selectedInvoice.store_address || 'Store Location'}</p>
                            </div>
                            <div className="detail-group">
                                <label>Status</label>
                                <p>
                                    <Badge variant="success">PAID</Badge>
                                </p>
                            </div>
                        </div>

                        <div className="detail-customer-box">
                            <h4>Customer Details</h4>
                            <div className="customer-info-grid">
                                <div className="customer-info-item">
                                    <span>Name:</span> {selectedInvoice.customer_name || 'Walk-in Customer'}
                                </div>
                                <div className="customer-info-item">
                                    <span>Phone:</span> {selectedInvoice.phone || 'N/A'}
                                </div>
                                {selectedInvoice.customer_gst && (
                                    <div className="customer-info-item">
                                        <span>GSTIN:</span> {selectedInvoice.customer_gst}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="items-section">
                            <h4>Items Ordered</h4>
                            <div className="invoice-items-scroll">
                                <table className="invoice-mini-table">
                                    <thead>
                                        <tr>
                                            <th>Product</th>
                                            <th>Unit Price</th>
                                            <th>Qty</th>
                                            <th>Tax</th>
                                            <th>Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedInvoice.items.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.product_name}</td>
                                                <td>₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                                <td>{item.quantity}</td>
                                                <td>₹{parseFloat(item.tax_amount || 0).toFixed(2)}</td>
                                                <td>₹{parseFloat(item.total_price || 0).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="detail-summary-section common-summary-list">
                            <div className="summary-row">
                                <span>Subtotal</span>
                                <span>₹{parseFloat(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Tax</span>
                                <span>₹{parseFloat(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Discount</span>
                                <span style={{color: 'var(--danger-color)'}}>-₹{parseFloat(selectedInvoice.discount_amount || 0).toFixed(2)}</span>
                            </div>
                            {selectedInvoice.round_off !== 0 && (
                                <div className="summary-row">
                                    <span>Round Off</span>
                                    <span>₹{parseFloat(selectedInvoice.round_off || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-row total">
                                <span>Grand Total</span>
                                <span>₹{parseFloat(selectedInvoice.grand_total || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
            </div>
        </MainLayout>
    );
};

export default Invoices;
