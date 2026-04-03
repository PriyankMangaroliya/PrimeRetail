import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus, Minus, Trash2, ShoppingCart, UserPlus, CreditCard, Banknote, Receipt, CheckCircle, X, Edit2, Pencil, Zap } from 'lucide-react';
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
import '../../styles/billing.css';

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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successData, setSuccessData] = useState(null);

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

    const [productDropdownOpen, setProductDropdownOpen] = useState(false);
    const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
    const [customerSearchResults, setCustomerSearchResults] = useState([]);

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
        if (searchPhone.length >= 3) {
            handleCustomerSearch();
        } else {
            setCustomerSearchResults([]);
        }
    }, [searchPhone]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (!e.target.closest('.common-search-box')) {
                setProductDropdownOpen(false);
                setCustomerDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!searchPhone || !phoneRegex.test(searchPhone)) {
            if (searchPhone.length >= 10) {
                // Do nothing or show error if it's 10 digits but invalid format
            }
            setCustomerSearchResults([]);
            return;
        }
        try {
            const response = await customerApi.getCustomerByPhone(searchPhone);
            // If direct match, but we want a dropdown, let's treat it as results
            if (response && response.data) {
                setCustomerSearchResults([response.data]);
                setCustomerDropdownOpen(true);
            } else {
                setCustomerSearchResults([]);
            }
        } catch (error) {
            setCustomerSearchResults([]);
            const phoneRegex = /^[6-9]\d{9}$/;
            if (error.status === 404 && phoneRegex.test(searchPhone)) {
                setNewCustomer({ ...newCustomer, phone: searchPhone });
                setShowCustomerModal(true);
            }
        }
    };

    const handleProductSearch = async (query) => {
        setProductSearch(query);
        if (query.length === 0) {
            setSearchResults(allProducts.slice(0, 10));
            setProductDropdownOpen(true);
            return;
        }
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await productApi.getProductsForSale({ search: query });
            setSearchResults(response.data || []);
            setProductDropdownOpen(true);
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
        setProductDropdownOpen(false);
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

            // Payment successful, show success modal
            setSuccessData({
                invoice_no: invoiceData.invoice_no,
                amount: totalPayable,
                method: selectedPaymentMethod.method_name,
                customer: customer?.name || 'Walk-in Customer',
                change: parseFloat(receivedAmount) - totalPayable
            });
            setShowSuccessModal(true);
            handleDone();
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Checkout failed';
            console.error('Checkout failed:', error);
            alert(`Checkout failed: ${errorMsg}. Please try again.`);
        } finally {
            setIsProcessing(false);
        }
    };
    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleAutoCheckout = async () => {
        if (cart.length === 0) return;

        setIsProcessing(true);
        try {
            // 1. Load Razorpay script
            const res = await loadRazorpayScript();
            if (!res) {
                alert('Razorpay SDK failed to load. Are you online?');
                return;
            }

            // 2. Create Razorpay order in backend
            const orderRes = await paymentApi.createRazorpayOrder({
                amount: totalPayable,
                receipt: `inv_${Date.now()}`
            });

            const order = orderRes.data.data;

            // 3. Configure Razorpay options
            const options = {
                key: import.meta.env.VITE_RAZORPAY_ID_KEY,
                amount: order.amount,
                currency: order.currency,
                name: 'Prime Retail',
                description: 'Payment for Invoice',
                order_id: order.id,
                handler: async function (response) {
                    try {
                        // 4. Verify payment in backend
                        const verifyData = {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            payment_method_id: paymentMethods.find(m => m.method_name.toLowerCase().includes('razorpay') || m.method_name.toLowerCase().includes('online'))?.id || selectedPaymentMethod?.id,
                            invoice_data: {
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
                                items: cart.map(item => ({
                                    product_id: item.product_id,
                                    quantity: item.quantity,
                                    unit_price: item.unit_price,
                                    tax_percentage: item.tax_percentage,
                                    tax_amount: item.tax_amount * item.quantity,
                                    discount_amount: 0,
                                    final_price: item.final_price,
                                    total_price: item.total_price
                                }))
                            }
                        };

                        const verifyRes = await paymentApi.verifyRazorpayPayment(verifyData);
                        if (verifyRes.data.success) {
                            setSuccessData({
                                invoice_no: verifyData.invoice_data.invoice_no,
                                amount: totalPayable,
                                method: 'Razorpay / Online',
                                customer: customer?.name || 'Walk-in Customer',
                                change: 0
                            });
                            setShowSuccessModal(true);
                            handleDone();
                        } else {
                            alert('Payment verification failed');
                        }
                    } catch (error) {
                        console.error('Verification error:', error);
                        alert('Error verifying payment');
                    } finally {
                        setIsProcessing(false);
                    }
                },
                prefill: {
                    name: customer?.name || '',
                    email: customer?.email || '',
                    contact: customer?.phone || ''
                },
                theme: {
                    color: '#6366f1'
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();

        } catch (error) {
            console.error('Auto Checkout Error:', error);
            alert('Failed to initialize auto checkout');
            setIsProcessing(false);
        }
    };

    const handleDone = () => {
        setCart([]);
        setCustomer(null);
        setSearchPhone('');
        setAppliedCoupon(null);
        setManualDiscount(0);
        setCouponCode('');
        setInvoiceResult(null);
        setReceivedAmount(0);
    };

    const getPaymentIcon = (methodName) => {
        const name = methodName.toLowerCase();
        if (name.includes('cash')) return '💵';                          // Cash Payment
        if (name.includes('card') || name.includes('nfc')) return '💳';  // Credit / Debit Card / NFC
        if (name.includes('wallet')) return '👛';                        // Mobile Wallet
        if (name.includes('net') || name.includes('bank')) return '💰';  // Bank / Deposit
        if (name.includes('upi') || name.includes('qr')) return '📲';    // UPI and QR Scan Payment
        if (name.includes('gift') || name.includes('voucherr')) return '🎁'; // Gift Card / Voucher
        if (name.includes('cheque') || name.includes('emi')) return '📝'; // Cheque / EMI
        if (name.includes('razorpay')) return '💠';      // Razorpay Payment Gateway
        if (name.includes('point')) return '⭐';         // Reward Points
        return '💳';
    };

    const handleCreateCustomer = async (e) => {
        e.preventDefault();
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(newCustomer.phone)) {
            alert('Please enter a valid 10-digit Indian phone number starting with 6-9');
            return;
        }
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
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(editCustomer.phone)) {
            alert('Please enter a valid 10-digit Indian phone number starting with 6-9');
            return;
        }
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
                    <div className="common-search-box">
                        <Search size={20} color="var(--gray-400)" />
                        <input
                            ref={productInputRef}
                            type="text"
                            placeholder="Scan Barcode or Search Product (Min 2 chars)..."
                            value={productSearch}
                            onChange={(e) => handleProductSearch(e.target.value)}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!productSearch) {
                                    setSearchResults(allProducts.slice(0, 10));
                                }
                                setProductDropdownOpen(true);
                            }}
                        />
                        {productDropdownOpen && searchResults.length > 0 && (
                            <div className="search-dropdown-menu">
                                {searchResults.map(product => (
                                    <div key={product.id} className="search-dropdown-item" onClick={() => addToCart(product)}>
                                        <div className="search-item-icon">
                                            <Icons.Package size={20} />
                                        </div>
                                        <div className="search-item-content">
                                            <span className="search-item-title">{product.product_name}</span>
                                            <div className="search-item-sub">
                                                <span>SKU: {product.sku}</span>
                                                <span>•</span>
                                                <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>₹{product.price}</span>
                                            </div>
                                        </div>
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
                        <div className="common-search-box" style={{ position: 'relative' }}>
                            <Search size={18} color="var(--gray-400)" />
                            <input
                                type="text"
                                placeholder="Phone Number (10 digits)"
                                value={searchPhone}
                                maxLength={10}
                                onChange={(e) => {
                                    const val = e.target.value.replace(/\D/g, '');
                                    setSearchPhone(val);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setCustomerDropdownOpen(true);
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleCustomerSearch()}
                            />
                            {customerDropdownOpen && customerSearchResults.length > 0 && (
                                <div className="search-dropdown-menu">
                                    {customerSearchResults.map(res => (
                                        <div
                                            key={res.id}
                                            className="search-dropdown-item"
                                            onClick={() => {
                                                setCustomer(res);
                                                setCustomerDropdownOpen(false);
                                                setSearchPhone(res.phone);
                                            }}
                                        >
                                            <div className="search-item-icon">
                                                <User size={20} />
                                            </div>
                                            <div className="search-item-content">
                                                <span className="search-item-title">{res.name}</span>
                                                <div className="search-item-sub">{res.phone}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="selection-result-card" style={{ marginBottom: 0 }}>
                            <div className="entity-info">
                                <div className="entity-icon" style={{ cursor: 'pointer' }} onClick={() => { setEditCustomer(customer); setShowEditCustomerModal(true); }} title="Edit Customer">
                                    <User size={24} />
                                </div>
                                <div className="entity-details">
                                    <span className="entity-name">{customer.name}</span>
                                    <div className="entity-sub">
                                        <span>{customer.phone}</span>
                                        {customer.loyalty_points !== undefined && (
                                            <>
                                                <span style={{ color: 'var(--gray-400)' }}>•</span>
                                                <span style={{ fontWeight: 600, color: 'var(--success-color)' }}>Points: {customer.loyalty_points}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div
                                className="entity-action"
                                onClick={() => {
                                    setCustomer(null);
                                    setSearchPhone('');
                                    setCustomerDropdownOpen(true);
                                }}
                                title="Change Customer"
                            >
                                <Icons.RefreshCw size={14} />
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
                                <label className="common-toggle">
                                    <div
                                        className={`toggle-switch ${isRoundOffEnabled ? 'active' : ''}`}
                                        onClick={() => setIsRoundOffEnabled(!isRoundOffEnabled)}
                                    >
                                        <div className="toggle-thumb" />
                                    </div>
                                </label>
                            </div>
                            <span>{roundoff >= 0 ? '+' : ''}{roundoff.toFixed(2)}</span>
                        </div>

                        <div className="total-payable-row">
                            <span>Total Payable</span>
                            <span>₹{totalPayable.toFixed(2)}</span>
                        </div>
                    </div>
                </div>


                <div className="checkout-actions-container">
                    <button
                        className="checkout-btn manual-checkout"
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleCheckout}
                    >
                        <CreditCard size={20} />
                        Manual Checkout
                    </button>

                    <button
                        className="checkout-btn auto-checkout"
                        disabled={cart.length === 0 || isProcessing}
                        onClick={handleAutoCheckout}
                    >
                        <Zap size={20} />
                        Auto Checkout
                    </button>
                </div>
            </aside>

            <Modal
                title="Checkout - Manual Payment"
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                maxWidth="600px"
            >
                <div className="manual-checkout-modal-content">
                    <div className="modal-section-title">Select Payment Method</div>

                    <div className="modal-amount-summary">
                        <span className="label">Total Amount Payable</span>
                        <span className="value">₹{totalPayable.toFixed(2)}</span>
                    </div>

                    <div className="modal-payment-grid">
                        {paymentMethods
                            .filter(pm => !pm.method_name.toLowerCase().includes('razorpay'))
                            .map(pm => (
                                <div
                                    key={pm.id}
                                    className={`modal-pm-card ${selectedPaymentMethod?.id === pm.id ? 'active' : ''}`}
                                    onClick={() => setSelectedPaymentMethod(pm)}
                                >
                                    <span className="pm-icon">{getPaymentIcon(pm.method_name)}</span>
                                    <span className="pm-name">{pm.method_name}</span>
                                    {selectedPaymentMethod?.id === pm.id && (
                                        <div className="pm-check">
                                            <CheckCircle size={14} />
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>

                    {selectedPaymentMethod && (
                        <div className="modal-payment-details animate-fade-in">
                            <div className="modal-input-row">
                                <div className="input-group">
                                    <label>Amount Received (₹)</label>
                                    <input
                                        type="number"
                                        className="modal-received-input"
                                        value={receivedAmount}
                                        onChange={(e) => setReceivedAmount(e.target.value)}
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                    />
                                </div>

                                <div className="modal-change-display">
                                    <span className="label">Change to Return</span>
                                    <span className={`change-value ${parseFloat(receivedAmount) - totalPayable < 0 ? 'text-danger' : 'text-success'}`}>
                                        ₹{Math.max(0, (parseFloat(receivedAmount) || 0) - totalPayable).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="modal-confirm-footer">
                        <button className="modal-cancel-btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
                        <button
                            className="modal-complete-btn"
                            disabled={!selectedPaymentMethod || isProcessing || (parseFloat(receivedAmount) < totalPayable)}
                            onClick={() => {
                                setShowConfirmModal(false);
                                processPayment();
                            }}
                        >
                            {isProcessing ? (
                                <><Loader size="small" /> Processing...</>
                            ) : (
                                <><Icons.Check size={20} /> Complete Transaction</>
                            )}
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
                        maxLength={10}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setNewCustomer({ ...newCustomer, phone: val });
                        }}
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
                        maxLength={10}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setEditCustomer({ ...editCustomer, phone: val });
                        }}
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

            {/* Success Modal */}
            <Modal
                title="Payment Success"
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                maxWidth="480px"
            >
                <div className="payment-success-modal">
                    <div className="success-lottie-container">
                        <div className="success-circle">
                            <CheckCircle size={48} />
                        </div>
                    </div>

                    <div className="success-header">
                        <h2>Invoice Completed</h2>
                        <p>Transaction processed and inventory updated.</p>
                    </div>

                    <div className="success-info-card">
                        <div className="success-row">
                            <div className="row-item">
                                <Receipt size={16} />
                                <span>Invoice No</span>
                            </div>
                            <strong>{successData?.invoice_no}</strong>
                        </div>

                        <div className="success-row">
                            <div className="row-item">
                                <User size={16} />
                                <span>Customer</span>
                            </div>
                            <strong>{successData?.customer}</strong>
                        </div>

                        <div className="success-row">
                            <div className="row-item">
                                <Banknote size={16} />
                                <span>Payment Method</span>
                            </div>
                            <strong>{successData?.method}</strong>
                        </div>

                        <div className="success-total-section">
                            <div className="total-main">
                                <div className="label">Total Paid</div>
                                <div className="amount">₹{successData?.amount.toFixed(2)}</div>
                            </div>
                            {successData?.change > 0 && (
                                <div className="total-change">
                                    <div className="label">Change Returned</div>
                                    <div className="amount">₹{successData?.change.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="success-actions">
                        <button className="success-print-btn">
                            <Icons.Printer size={20} />
                            Print Receipt
                        </button>
                        <button className="success-done-btn" onClick={() => setShowSuccessModal(false)}>
                            New Transaction
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Billing;
