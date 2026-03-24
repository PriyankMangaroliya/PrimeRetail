import React, {useState, useEffect} from 'react';
import {useAuth} from '../../context/AuthContext.jsx';
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


const Invoices = () => {
    const {user} = useAuth();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState(null);

    const isOwner = user?.role_name === 'Store Owner';

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
        ...(isOwner ? [{
            title: 'Store Code', key: 'store_code',
            render: (val) => <Badge variant="primary" className="badge-code">{val}</Badge>
        }] : []),
        {
            title: 'Date',
            key: 'created_at',
            render: (val) => new Date(val).toLocaleDateString()
        },
        {title: 'Customer', key: 'customer_name', render: (val) => val || 'Walk-in Customer'},

        {title: 'Total', key: 'grand_total', render: (val) => `₹${parseFloat(val).toFixed(2)}`},
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
                        <Icons.Actions size={16}/>
                    </button>
                    {activeDropdown === record.id && (
                        <div className="action-dropdown">
                            <button className="action-item" onClick={() => {
                                handleViewDetails(record.id);
                                setActiveDropdown(null);
                            }}>
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
                <div className="page-loading">
                    <Loader size="large"/>
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
                            className="common-table"
                            columnSearchable={true}
                            searchable={false}
                            itemName="Invoices"
                            loading={loading}
                        />
                    ) : (
                        <EmptyState
                            icon={<Icons.FileText size={48}/>}
                            title="No Invoices Found"
                            description="There are no recorded sales invoices."
                        />
                    )}
                </Card> {showDetails && selectedInvoice && (
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
                    <div className="detail-view-container invoice-view">
                        <div className="detail-main-info">
                            <div className="detail-avatar-large">
                                <Icons.FileText size={32}/>
                            </div>
                            <div className="detail-title-group">
                                <h2>{selectedInvoice.invoice_no}</h2>
                                <div className="detail-meta">
                                    <Badge variant="primary"
                                           className="badge-code">{selectedInvoice.invoice_type || 'RETAIL'}</Badge>
                                </div>
                            </div>
                        </div>

                        <div className="view-grid">
                            <div className="view-group">
                                <label>Invoice Date</label>
                                <p>{new Date(selectedInvoice.created_at).toLocaleString()}</p>
                            </div>
                            <div className="view-group">
                                <label>Processed By</label>
                                <p>{selectedInvoice.cashier_name || 'N/A'}</p>
                            </div>
                            <div className="view-group">
                                <label>Payment Method</label>
                                <p>{selectedInvoice.payment_method || 'Cash'}</p>
                            </div>
                            <div className="view-group">
                                <label>Store Code</label>
                                <p>{selectedInvoice.store_code}</p>
                            </div>
                            <div className="view-group full-width">
                                <label>Billing Location</label>
                                <p>{selectedInvoice.store_name} - {selectedInvoice.store_address || 'Store Location'}</p>
                            </div>
                        </div>

                        <div className="view-section" style={{marginTop: '32px'}}>
                            <h4 className="view-section-header"><Icons.User size={18}/> Customer Information</h4>
                            <div className="detail-info-card" style={{
                                background: 'var(--gray-50)',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '1px solid var(--gray-100)'
                            }}>
                                <div className="info-card-grid" style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '20px'
                                }}>
                                    <div className="info-item">
                                        <span style={{
                                            fontSize: '13px',
                                            color: 'var(--gray-500)',
                                            display: 'block',
                                            marginBottom: '4px'
                                        }}>Full Name</span>
                                        <strong style={{
                                            fontSize: '15px',
                                            color: 'var(--gray-800)'
                                        }}>{selectedInvoice.customer_name || 'Walk-in Customer'}</strong>
                                    </div>
                                    <div className="info-item">
                                        <span style={{
                                            fontSize: '13px',
                                            color: 'var(--gray-500)',
                                            display: 'block',
                                            marginBottom: '4px'
                                        }}>Contact No</span>
                                        <strong style={{
                                            fontSize: '15px',
                                            color: 'var(--gray-800)'
                                        }}>{selectedInvoice.phone || 'N/A'}</strong>
                                    </div>
                                    {selectedInvoice.customer_gst && (
                                        <div className="info-item">
                                            <span style={{
                                                fontSize: '13px',
                                                color: 'var(--gray-500)',
                                                display: 'block',
                                                marginBottom: '4px'
                                            }}>GSTIN</span>
                                            <strong style={{
                                                fontSize: '15px',
                                                color: 'var(--gray-800)'
                                            }}>{selectedInvoice.customer_gst}</strong>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="view-section" style={{marginTop: '32px'}}>
                            <h4 className="view-section-header"><Icons.Package size={18}/> Items Ordered</h4>
                            <div className="detail-table-wrapper" style={{
                                border: '1px solid var(--gray-100)',
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <table className="common-mini-table">
                                    <thead>
                                    <tr>
                                        <th>Product Description</th>
                                        <th className="text-right">Unit Price</th>
                                        <th className="text-center">Qty</th>
                                        <th className="text-right">Tax</th>
                                        <th className="text-right">Total</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedInvoice.items.map((item, idx) => (
                                        <tr key={idx}>
                                            <td style={{fontWeight: '600'}}>{item.product_name}</td>
                                            <td className="text-right">₹{parseFloat(item.unit_price || 0).toFixed(2)}</td>
                                            <td className="text-center">{item.quantity}</td>
                                            <td className="text-right">₹{parseFloat(item.tax_amount || 0).toFixed(2)}</td>
                                            <td className="text-right"
                                                style={{fontWeight: '700'}}>₹{parseFloat(item.total_price || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="detail-summary-section">
                            <div className="summary-row">
                                <span>Subtotal Amount</span>
                                <span>₹{parseFloat(selectedInvoice.total_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row">
                                <span>Total Applied Tax</span>
                                <span>₹{parseFloat(selectedInvoice.tax_amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="summary-row highlight-danger">
                                <span>Discount Applied</span>
                                <span
                                    style={{color: 'var(--danger-color)'}}>-₹{parseFloat(selectedInvoice.discount_amount || 0).toFixed(2)}</span>
                            </div>
                            {selectedInvoice.round_off !== 0 && (
                                <div className="summary-row">
                                    <span>Round Off Adjustment</span>
                                    <span>₹{parseFloat(selectedInvoice.round_off || 0).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="summary-row total-row">
                                <span>Amount Payable</span>
                                <span
                                    className="total-value">₹{parseFloat(selectedInvoice.grand_total || 0).toFixed(2)}</span>
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
