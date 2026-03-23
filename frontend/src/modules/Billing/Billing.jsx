import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, Minus, Trash2, ShoppingCart, UserPlus, CreditCard, Banknote, Receipt, CheckCircle, X, Edit2, Pencil } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import customerApi from '../../api/customer.api';
import productApi from '../../api/product.api';
import billingApi from '../../api/billing.api';
import paymentApi from '../../api/payment.api';
import paymentMethodApi from '../../api/paymentMethod.api';
import discountApi from '../../api/discount.api';
import Modal from '../../components/common/Modal/Modal.jsx';
import Input from '../../components/common/Input/Input';
import Button from '../../components/common/Button/Button';
import Loader from '../../components/common/Loader/Loader';
import Icons from '../../components/common/Icons';
import './Billing.css';

const Billing = () => {
    const { user } = useAuth();
    const [cart, setCart] = useState([]);
    const [customer, setCustomer] = useState(null);
    const [searchPhone, setSearchPhone] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [allProducts, setAllProducts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
    const [receivedAmount, setReceivedAmount] = useState(0);
    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [showEditCustomerModal, setShowEditCustomerModal] = useState(false);
    const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [editCustomer, setEditCustomer] = useState({ name: '', phone: '', email: '', address: '' });
    const [isProcessing, setIsProcessing] = useState(false);
    const [invoiceResult, setInvoiceResult] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Redesign States
    const [showCouponModal, setShowCouponModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [manualDiscount, setManualDiscount] = useState(0);
    const [isRoundOffEnabled, setIsRoundOffEnabled] = useState(true);

    const [discountAmount, setDiscountAmount] = useState(0);
    const [discountCode, setDiscountCode] = useState('');
    const [appliedDiscount, setAppliedDiscount] = useState(null);
    const [roundOff, setRoundOff] = useState(0);

    const productInputRef = useRef(null);

    // Derived Calculations
    const subtotal = cart.reduce((acc, item) => acc + (item.unit_price * item.quantity), 0);
    const taxAmount = cart.reduce((acc, item) => {
        const itemSubtotal = item.unit_price * item.quantity;
        return acc + (itemSubtotal * (item.tax_percentage || 0) / 100);
    }, 0);

    const calculateCouponAmount = () => {
        if (!appliedCoupon) return 0;
        const base = subtotal + taxAmount;
        if (appliedCoupon.discount_type === 'Percentage') {
            return (base * appliedCoupon.discount_value) / 100;
        }
        return Math.min(appliedCoupon.discount_value, base);
    };

    const couponAmount = calculateCouponAmount();
    const totalBeforeRoundoff = subtotal + taxAmount - couponAmount - manualDiscount;
    const roundoff = isRoundOffEnabled ? Math.round(totalBeforeRoundoff) - totalBeforeRoundoff : 0;
    const totalPayable = totalBeforeRoundoff + roundoff;

    useEffect(() => {
        fetchPaymentMethods();
        fetchProducts();
        if (productInputRef.current) productInputRef.current.focus();
    }, []);

    useEffect(() => {
        if (searchPhone.length === 10) {
            handleCustomerSearch();
        }
    }, [searchPhone]);

    useEffect(() => {
        calculateRounding();
    }, [cart, discountAmount]);

    const calculateRounding = () => {
        const subtotal = calculateSubtotal();
        const tax = calculateTotalTax();
        const totalBeforeRound = subtotal + tax - discountAmount;
        const roundedTotal = Math.round(totalBeforeRound);
        setRoundOff(parseFloat((roundedTotal - totalBeforeRound).toFixed(2)));
    };

    const fetchProducts = async () => {
        try {
            const response = await productApi.getProductsForSale();
            setAllProducts(response.data);
            // Initially show some products if search is empty
            setSearchResults(response.data.slice(0, 10));
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const response = await paymentMethodApi.getActivePaymentMethods();
            if (response && response.success && Array.isArray(response.data)) {
                setPaymentMethods(response.data);
                if (response.data.length > 0) setSelectedPaymentMethod(response.data[0]);
            } else {
                console.warn('Payment methods response was not as expected:', response);
                setPaymentMethods([]);
            }
        } catch (error) {
            console.error('Error fetching payment methods:', error);
            setPaymentMethods([]);
        }
    };

    const handleCustomerSearch = async () => {
        if (!searchPhone || searchPhone.length < 10) return;
        try {
            const response = await customerApi.getCustomerByPhone(searchPhone);
            if (response && response.data) {
                setCustomer(response.data);
            } else {
                setNewCustomer({ ...newCustomer, phone: searchPhone });
                setShowCustomerModal(true);
            }
        } catch (error) {
            if (error.status === 404) {
                setNewCustomer({ ...newCustomer, phone: searchPhone });
                setShowCustomerModal(true);
            } else {
                console.error('Error searching customer:', error);
            }
        }
    };

    const handleProductSearch = async (query) => {
        setProductSearch(query);
        if (query.length === 0) {
            setSearchResults(allProducts.slice(0, 10));
            return;
        }
        if (query.length < 2) {
            return;
        }
        try {
            const response = await productApi.getProductsForSale({ search: query });
            setSearchResults(response.data || []);
        } catch (error) {
            console.error('Error searching products:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find(item => item.product_id === product.id);
        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            const tax_percentage = product.tax_percentage || 0;
            const unit_price = parseFloat(product.price);
            const tax_amount = (unit_price * tax_percentage) / 100;
            const final_price = unit_price + tax_amount;

            setCart([...cart, {
                product_id: product.id,
                name: product.product_name,
                sku: product.sku,
                unit_price: unit_price,
                tax_percentage: tax_percentage,
                tax_amount: tax_amount,
                discount_amount: 0,
                final_price: final_price,
                quantity: 1,
                total_price: final_price
            }]);
        }
        setProductSearch('');
        setSearchResults([]);
        if (productInputRef.current) productInputRef.current.focus();
    };

    const updateQuantity = (productId, newQty) => {
        if (newQty < 1) return;
        setCart(cart.map(item => {
            if (item.product_id === productId) {
                const total_price = item.final_price * newQty;
                return { ...item, quantity: newQty, total_price: total_price };
            }
            return item;
        }));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.product_id !== productId));
    };

    const calculateSubtotal = () => cart.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    const calculateTotalTax = () => cart.reduce((sum, item) => sum + (item.tax_amount * item.quantity), 0);
    const calculateGrandTotal = () => {
        const total = calculateSubtotal() + calculateTotalTax() - discountAmount + roundOff;
        return parseFloat(total.toFixed(2));
    };

    const applyCoupon = async (e) => {
        e.preventDefault();
        try {
            const response = await discountApi.validateDiscount(couponCode, subtotal + taxAmount);
            if (response.data) {
                setAppliedCoupon(response.data.discount);
                setShowCouponModal(false);
            }
        } catch (error) {
            alert(error.message || 'Invalid coupon code');
        }
    };

    const applyManualDiscount = (e) => {
        e.preventDefault();
        const amt = parseFloat(manualDiscount);
        if (isNaN(amt) || amt < 0) {
            alert('Please enter a valid amount');
            return;
        }
        if (amt > (subtotal + taxAmount - couponAmount)) {
            alert('Discount cannot exceed total');
            return;
        }
        setShowDiscountModal(false);
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setShowConfirmModal(true);
        setReceivedAmount(calculateGrandTotal());
    };

    const processPayment = async () => {
        setIsProcessing(true);
        try {
            // Variables already defined in component body: subtotal, taxAmount, totalPayable, etc.

            const invoiceData = {
                store_id: user.store_id,
                invoice_no: `INV-${Date.now()}`,
                cashier_id: user.id,
                customer_id: customer ? customer.id : null,
                total_amount: subtotal,
                tax_amount: taxAmount,
                discount_amount: couponAmount + (parseFloat(manualDiscount) || 0),
                discount_id: appliedCoupon ? appliedCoupon.id : null,
                round_off: roundoff,
                grand_total: totalPayable,
                invoice_type: 'SALE',
                created_by: user.id,
                items: cart.map(item => ({
                    product_id: item.product_id,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    tax_percentage: item.tax_percentage,
                    tax_amount: item.tax_amount * item.quantity,
                    discount_amount: 0, // Individual item discounts aren't fully integrated here yet
                    final_price: item.final_price,
                    total_price: item.total_price
                }))
            };

            const invResponse = await billingApi.createInvoice(invoiceData);
            const invoiceId = invResponse.data.data.id;

            const paymentData = {
                invoice_id: invoiceId,
                payment_method_id: selectedPaymentMethod.id,
                payment_type: 'FULL',
                amount: totalPayable,
                received_amount: parseFloat(receivedAmount),
                change_amount: parseFloat(receivedAmount) - totalPayable,
                transaction_reference: '',
                payment_status: 'COMPLETED',
                created_by: user.id
            };

            await paymentApi.createPayment(paymentData);

            // Payment successful, show alert and reset page for next bill
            alert('Payment completed successfully!');
            handleDone();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Checkout failed';
            console.error('Checkout failed:', error);
            alert(`Checkout failed: ${errorMsg}. Please try again.`);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDone = () => {
        setCart([]);
        setCustomer(null);
        setSearchPhone('');
        setAppliedCoupon(null);
        setManualDiscount('');
        setCouponCode('');
        setInvoiceResult(null);
    };

    const getPaymentIcon = (methodName) => {
        const name = methodName.toLowerCase();
        if (name.includes('cash')) return '💵';
        if (name.includes('card')) return '💳';
        if (name.includes('point')) return '⭐';
        if (name.includes('deposit')) return '💰';
        if (name.includes('cheque')) return '📝';
        if (name.includes('gift')) return '🎁';
        if (name.includes('scan') || name.includes('qr')) return '🤳';
        if (name.includes('later')) return '⏳';
        if (name.includes('external')) return '🏧';
        if (name.includes('split')) return '✂️';
        return '💳';
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        try {
            const response = await customerApi.createCustomer({ ...newCustomer, created_by: user.id });
            setCustomer(response.data);
            setShowCustomerModal(false);
            setSearchPhone(newCustomer.phone);
        } catch (error) {
            console.error('Error creating customer:', error);
        }
    };

    const handleUpdateCustomer = async (e) => {
        e.preventDefault();
        try {
            const response = await customerApi.updateCustomer(customer.id, { ...editCustomer, updated_by: user.id });
            setCustomer(response.data);
            setShowEditCustomerModal(false);
        } catch (error) {
            console.error('Error updating customer:', error);
        }
    };

    return (
        <div className="billing-container">
            <div className="billing-main">
                <header className="billing-header">
                    <div className="search-box">
                        <Search size={20} />
                        <Input
                            ref={productInputRef}
                            type="text"
                            placeholder="Scan Barcode or Search Product (Min 2 chars)..."
                            value={productSearch}
                            onChange={(e) => handleProductSearch(e.target.value)}
                            className="billing-product-search"
                        />
                        {searchResults.length > 0 && (
                            <div className="product-dropdown">
                                {searchResults.map(product => (
                                    <div key={product.id} className="dropdown-item" onClick={() => addToCart(product)}>
                                        <div className="product-info">
                                            <span className="product-name">{product.product_name}</span>
                                            <span className="product-sku">{product.sku}</span>
                                        </div>
                                        <span className="product-price">₹{product.price}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </header>

                <div className="cart-section">
                    <table className="cart-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Price</th>
                                <th>Qty</th>
                                <th>Tax</th>
                                <th>Total</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {cart.map(item => (
                                <tr key={item.product_id}>
                                    <td>
                                        <div className="item-name">{item.name}</div>
                                        <div className="item-sku">{item.sku}</div>
                                    </td>
                                    <td>₹{item.unit_price}</td>
                                    <td>
                                        <div className="qty-controls">
                                            <button onClick={() => updateQuantity(item.product_id, item.quantity - 1)}><Minus size={14} /></button>
                                            <span>{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.product_id, item.quantity + 1)}><Plus size={14} /></button>
                                        </div>
                                    </td>
                                    <td>₹{(item.tax_amount * item.quantity).toFixed(2)}</td>
                                    <td>₹{item.total_price.toFixed(2)}</td>
                                    <td>
                                        <button className="delete-btn" onClick={() => removeFromCart(item.product_id)}><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {cart.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="empty-cart">
                                        <ShoppingCart size={48} />
                                        <p>Your cart is empty</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <aside className="billing-sidebar">
                <div className="customer-section">
                    <div className="section-header">
                        <h3>Customer</h3>
                        {!customer && <span className="walkin-tag">Walk-in</span>}
                    </div>
                    {!customer ? (
                        <div className="customer-search">
                            <Input
                                type="text"
                                placeholder="Phone Number"
                                value={searchPhone}
                                onChange={(e) => setSearchPhone(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                                className="billing-customer-search"
                            />
                            <Button
                                variant="ghost"
                                size="small"
                                onClick={handleCustomerSearch}
                            >
                                <Search size={18} />
                            </Button>
                        </div>
                    ) : (
                        <div className="customer-badge">
                            <div className="customer-info">
                                <User size={20} className="text-indigo-600" />
                                <div className="customer-details">
                                    <div className="cust-name">{customer.name}</div>
                                    <div className="cust-phone-row">
                                        <span className="cust-phone">{customer.phone}</span>
                                        {customer.loyalty_points !== undefined && (
                                            <span className="cust-points">Points: {customer.loyalty_points}</span>
                                        )}
                                    </div>
                                    {customer.email && <div className="cust-email">{customer.email}</div>}
                                </div>
                            </div>
                            <div className="action-buttons">
                                <Button
                                    variant="ghost"
                                    size="small"
                                    onClick={() => { setEditCustomer(customer); setShowEditCustomerModal(true); }}
                                    title="Edit"
                                >
                                    <Edit2 size={16} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="small"
                                    onClick={() => { setCustomer(null); setSearchPhone(''); }}
                                    title="Remove"
                                >
                                    <Icons.X size={16} />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="summary-section">
                    <div className="section-header">
                        <h3>Payment Summary</h3>
                    </div>

                    <div className="summary-table common-summary-list">
                        <div className="summary-row">
                            <span>Sub Total</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <span>Total Tax</span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>

                        <div className="summary-row">
                            <div className="row-label">
                                <span>Coupon</span>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setShowCouponModal(true)}
                                    className="edit-summary-btn"
                                >
                                    <Icons.Edit size={14} />
                                </Button>
                            </div>
                            <span>₹{couponAmount.toFixed(2)}</span>
                        </div>

                        <div className="summary-row discount-row">
                            <div className="row-label">
                                <span className={parseFloat(manualDiscount) > 0 ? 'text-red' : ''}>Discount</span>
                                <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => setShowDiscountModal(true)}
                                    className="edit-summary-btn"
                                >
                                    <Icons.Edit size={14} />
                                </Button>
                            </div>

                            <span className={parseFloat(manualDiscount) > 0 ? 'text-red' : ''}>₹{(parseFloat(manualDiscount) || 0).toFixed(2)}</span>
                        </div>

                        <div className="summary-row toggle-row">
                            <div className="row-label">
                                <span>Roundoff</span>
                                <div
                                    className={`toggle-switch ${isRoundOffEnabled ? 'active' : ''}`}
                                    onClick={() => setIsRoundOffEnabled(!isRoundOffEnabled)}
                                >
                                    <div className="toggle-thumb" />
                                </div>

                            </div>
                            <span>{roundoff >= 0 ? '+' : ''}{roundoff.toFixed(2)}</span>
                        </div>

                        <div className="total-payable-row">
                            <span>Total Payable</span>
                            <span>₹{totalPayable.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="payment-selection-sidebar">
                    <div className="section-header">
                        <h3>Select Payment</h3>
                    </div>
                    <div className="payment-methods-grid">
                        {paymentMethods.map(pm => (
                            <div
                                key={pm.id}
                                className={`pm-card ${selectedPaymentMethod?.id === pm.id ? 'active' : ''}`}
                                onClick={() => setSelectedPaymentMethod(pm)}
                            >
                                <span className="pm-icon">{getPaymentIcon(pm.method_name)}</span>
                                <span className="pm-name">{pm.method_name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <button
                    className="checkout-btn"
                    disabled={cart.length === 0 || !selectedPaymentMethod}
                    onClick={handleCheckout}
                >
                    <CreditCard size={20} />
                    Checkout
                </button>
            </aside>


            {/* Confirmation Modal */}
            <Modal
                title="Payment Confirmation"
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                maxWidth="400px"
            >
                <div className="confirm-payment-content">
                    <div className="help-icon-container">?</div>
                    <h3>Confirm Payment</h3>
                    <p>Total Amount: <strong>₹{totalPayable.toFixed(2)}</strong></p>
                    <p>Method: <strong>{selectedPaymentMethod?.method_name}</strong></p>
                    <p className="sub-msg">Was the payment successful?</p>

                    <div className="confirm-actions">
                        <button className="confirm-no-btn" onClick={() => setShowConfirmModal(false)}>No, Cancel</button>
                        <button
                            className="confirm-yes-btn"
                            onClick={() => {
                                setShowConfirmModal(false);
                                processPayment();
                            }}
                            disabled={isProcessing}
                        >
                            {isProcessing ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Loader size="small" /> Processing...
                                </div>
                            ) : 'Yes, Complete'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* New Customer Modal */}
            <Modal
                title="Add New Customer"
                isOpen={showCustomerModal}
                onClose={() => setShowCustomerModal(false)}
                className="customer-modal"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowCustomerModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleCreateCustomer}>Add Customer</Button>
                    </>
                }
            >
                <form onSubmit={handleCreateCustomer}>
                    <Input
                        label="Name"
                        type="text"
                        required
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        type="text"
                        required
                        value={newCustomer.phone}
                        readOnly
                    />
                    <Input
                        label="Email (Optional)"
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                    <div className="input-group">
                        <label>Address (Optional)</label>
                        <textarea
                            value={newCustomer.address}
                            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                title="Edit Customer Details"
                isOpen={showEditCustomerModal}
                onClose={() => setShowEditCustomerModal(false)}
                className="customer-modal"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowEditCustomerModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={handleUpdateCustomer}>Update Customer</Button>
                    </>
                }
            >
                <form onSubmit={handleUpdateCustomer}>
                    <Input
                        label="Name"
                        type="text"
                        required
                        value={editCustomer.name}
                        onChange={(e) => setEditCustomer({ ...editCustomer, name: e.target.value })}
                    />
                    <Input
                        label="Phone"
                        type="text"
                        required
                        value={editCustomer.phone}
                        readOnly
                    />
                    <Input
                        label="Email (Optional)"
                        type="email"
                        value={editCustomer.email || ''}
                        onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                    />
                    <div className="input-group">
                        <label>Address (Optional)</label>
                        <textarea
                            value={editCustomer.address || ''}
                            onChange={(e) => setEditCustomer({ ...editCustomer, address: e.target.value })}
                        />
                    </div>
                </form>
            </Modal>

            <Modal
                title="Verify Coupon Code"
                isOpen={showCouponModal}
                onClose={() => setShowCouponModal(false)}
                className="summary-modal"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowCouponModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={applyCoupon}>Verify & Apply</Button>
                    </>
                }
            >
                <form onSubmit={applyCoupon}>
                    <Input
                        label="Enter Coupon Code"
                        type="text"
                        required
                        placeholder="e.g. SUMMER25"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                    />
                </form>
            </Modal>

            <Modal
                title="Add Manual Discount"
                isOpen={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                className="summary-modal"
                footer={
                    <>
                        <Button variant="outline" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
                        <Button variant="primary" onClick={applyManualDiscount}>Apply Discount</Button>
                    </>
                }
            >
                <form onSubmit={applyManualDiscount}>
                    <Input
                        label="Discount Amount (₹)"
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={manualDiscount}
                        onChange={(e) => setManualDiscount(e.target.value)}
                    />
                </form>
            </Modal>
        </div>
    );
};

export default Billing;
