import React, { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import Icons from '../../components/common/Icons';
import Badge from '../../components/common/Badge/Badge';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

const CashierDashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        totalInvoices: 0,
        totalPayments: 0
    });
    const [loading, setLoading] = useState(true);
    const [cart, setCart] = useState([]);
    const [barcode, setBarcode] = useState('');

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const addToCart = () => {
        // Mock function to add item
        setCart([...cart, { id: Date.now(), name: 'Product', price: 25.99, qty: 1 }]);
        setBarcode('');
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0).toFixed(2);
    };

    return (
        <MainLayout>
            <div className="dashboard-container cashier-dashboard">
                <div className="page-header">
                    <div>
                        <h1>Point of Sale</h1>
                        <p>Welcome back, Cashier! Ready to process sales?</p>
                    </div>
                    <Button onClick={fetchStats} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Stats Grid */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Package size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Products</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalProducts}</p>
                            <Badge variant="success">Catalog</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.BarChart size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stock</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalStock.toLocaleString()}</p>
                            <Badge variant="success">Available</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.FileText size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Invoices</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalInvoices}</p>
                            <Badge variant="info">Count</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.DollarSign size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Payments</h3>
                            <p className="stat-value">{loading ? '...' : `$${stats.totalPayments.toLocaleString()}`}</p>
                            <Badge variant="success">Revenue</Badge>
                        </div>
                    </Card>
                </div>

                <div className="pos-layout">
                    {/* Left Side - Products */}
                    <div className="pos-products">
                        <Card className="product-scanner">
                            <h3>Scan Product</h3>
                            <div className="scanner-input">
                                <Input
                                    value={barcode}
                                    onChange={(e) => setBarcode(e.target.value)}
                                    placeholder="Scan barcode or enter SKU"
                                    onKeyPress={(e) => e.key === 'Enter' && addToCart()}
                                />
                                <Button onClick={addToCart}><Icons.Plus size={18} /> Add</Button>
                            </div>
                        </Card>

                        <Card className="quick-products">
                            <h3>Quick Products</h3>
                            <div className="product-grid">
                                {[1, 2, 3, 4, 5, 6].map((item) => (
                                    <Button key={item} variant="outline" onClick={addToCart}>
                                        Product {item}<br />
                                        <small>$25.99</small>
                                    </Button>
                                ))}
                            </div>
                        </Card>
                    </div>

                    {/* Right Side - Cart */}
                    <Card className="pos-cart">
                        <h3>Current Sale</h3>
                        <div className="cart-items">
                            {cart.map((item) => (
                                <div key={item.id} className="cart-item">
                                    <span>{item.name}</span>
                                    <span>${item.price}</span>
                                    <span>x{item.qty}</span>
                                    <span>${(item.price * item.qty).toFixed(2)}</span>
                                    <Button
                                        variant="ghost"
                                        size="small"
                                        className="remove-item"
                                        onClick={() => setCart(cart.filter(c => c.id !== item.id))}
                                        title="Remove item"
                                    >
                                        <Icons.X size={14} />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div className="cart-totals common-summary-list">
                            <div className="summary-row">
                                <span>Subtotal:</span>
                                <span>${calculateTotal()}</span>
                            </div>
                            <div className="summary-row">
                                <span>Tax (10%):</span>
                                <span>${(parseFloat(calculateTotal()) * 0.1).toFixed(2)}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total:</span>
                                <span>${(parseFloat(calculateTotal()) * 1.1).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="payment-actions">
                            <Button fullWidth size="large"><Icons.Zap size={18} style={{ marginRight: '8px' }} /> Process Payment</Button>
                            <Button fullWidth variant="outline" size="large"><Icons.Clock size={18} style={{ marginRight: '8px' }} /> Hold Sale</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default CashierDashboard;