import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Icons from '../../common/Icons';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const location = useLocation();
    const [menuItems, setMenuItems] = useState([]);

    // Define menu items with icons and URLs for each role
    const roleMenus = {
        'Super Admin': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/admin/dashboard' },
            { name: 'Roles', icon: Icons.Shield, url: '/admin/roles' },
            { name: 'Store Owners', icon: Icons.Users, url: '/admin/store-owners' },
            { name: 'Taxes', icon: Icons.Receipt, url: '/admin/taxes' },
            { name: 'Payment Methods', icon: Icons.CreditCard, url: '/admin/payment-methods' },
            { name: 'Reports', icon: Icons.BarChart, url: '/admin/reports' }
        ],
        'Store Owner': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/owner/dashboard' },
            { name: 'My Stores', icon: Icons.Store, url: '/owner/stores' },
            { name: 'Warehouse', icon: Icons.Warehouse, url: '/owner/warehouse' },
            { name: 'Employee', icon: Icons.Users, url: '/owner/employees' },
            { name: 'Taxes', icon: Icons.Receipt, url: '/owner/taxes' },
            { name: 'Discounts', icon: Icons.Tag, url: '/owner/discounts' },
            { name: 'Category', icon: Icons.Layers, url: '/owner/category' },
            { name: 'Products', icon: Icons.Package, url: '/owner/products' },
            { name: 'Stock', icon: Icons.Boxes, url: '/owner/stock' },
            { name: 'Invoices', icon: Icons.FileText, url: '/owner/invoices' },
            { name: 'Payments', icon: Icons.DollarSign, url: '/owner/payments' },
            { name: 'Reports', icon: Icons.BarChart, url: '/owner/reports' }
        ],
        'Store Manager': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/manager/dashboard' },
            { name: 'Employee', icon: Icons.Users, url: '/manager/employees' },
            { name: 'Products', icon: Icons.Product, url: '/manager/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/manager/stock' },
            { name: 'Invoices', icon: Icons.Invoice, url: '/manager/invoices' },
            { name: 'Payments', icon: Icons.Currency, url: '/manager/payments' },
            { name: 'Reports', icon: Icons.BarChart, url: '/manager/reports' }
        ],
        'Cashier': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/cashier/dashboard' },
            { name: 'Billing', icon: Icons.Cart, url: '/cashier/billing' },
            { name: 'Products', icon: Icons.Product, url: '/cashier/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/cashier/stock' },
            { name: 'Invoices', icon: Icons.Invoice, url: '/cashier/invoices' },
            { name: 'Payments', icon: Icons.Currency, url: '/cashier/payments' },
            { name: 'Reports', icon: Icons.BarChart, url: '/cashier/reports' }
        ],
        'Inventory Staff': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/inventory/dashboard' },
            { name: 'Products', icon: Icons.Product, url: '/inventory/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/inventory/stock' },
            { name: 'Reports', icon: Icons.BarChart, url: '/inventory/reports' }
        ],
        'Warehouse Staff': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/warehouse/dashboard' },
            { name: 'Products', icon: Icons.Product, url: '/warehouse/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/warehouse/stock' },
            { name: 'Reports', icon: Icons.BarChart, url: '/warehouse/reports' }
        ]
    };

    useEffect(() => {
        if (user?.role_name) {
            setMenuItems(roleMenus[user.role_name] || [{ name: 'Dashboard', icon: Icons.Dashboard, url: '/dashboard' }]);
        }
    }, [user]);

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>PrimeRetail</h2>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    {menuItems.map(item => (
                        <NavLink
                            key={item.name}
                            to={item.url}
                            className={({ isActive }) => {
                                const isTransactionsView = location.pathname.includes('/transactions');
                                const forceActive = isTransactionsView && item.name === 'Stock';
                                return `nav-item ${isActive || forceActive ? 'active' : ''}`;
                            }}
                        >
                            <span className="nav-item-icon">
                                <item.icon size={20} strokeWidth={2.5} />
                            </span>
                            <span className="nav-item-label">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;