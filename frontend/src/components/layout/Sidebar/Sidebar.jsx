import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Icons from '../../common/Icons';
import './Sidebar.css';

const Sidebar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
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
            { name: 'Reports', icon: Icons.Report, url: '/manager/reports' }
        ],
        'Cashier': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/cashier/dashboard' },
            { name: 'Products', icon: Icons.Product, url: '/cashier/products' },
            { name: 'Manage Invoices', icon: Icons.Search, url: '/cashier/invoices' }
        ],
        'Inventory Staff': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/inventory/dashboard' },
            { name: 'Products', icon: Icons.Product, url: '/inventory/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/inventory/stock' },
            { name: 'Reports', icon: Icons.Report, url: '/inventory/reports' }
        ],
        'Warehouse Staff': [
            { name: 'Dashboard', icon: Icons.Dashboard, url: '/warehouse/dashboard' },
            { name: 'Products', icon: Icons.Product, url: '/warehouse/products' },
            { name: 'Stock', icon: Icons.Stock, url: '/warehouse/stock' },
            { name: 'Reports', icon: Icons.Report, url: '/warehouse/reports' }
        ]
    };

    useEffect(() => {
        if (user?.role_name) {
            setMenuItems(roleMenus[user.role_name] || [{ name: 'Dashboard', icon: Icons.Dashboard, url: '/dashboard' }]);
        }
    }, [user]);

    const handleLogout = () => {
        // Add logout logic here
        navigate('/login');
    };

    const getUserInitials = () => {
        if (!user?.name) return 'U';
        return user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const getRoleDisplay = () => {
        if (!user?.role_name) return 'User';
        return user.role_name;
    };

    return (
        <div className="sidebar">
            <div className="sidebar-header">
                <h2>PrimeRetail</h2>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">
                    {/* <h3 className="nav-section-title">MAIN MENU</h3> */}
                    {menuItems.map(item => (
                        <NavLink
                            key={item.name}
                            to={item.url}
                            className={({ isActive }) =>
                                `nav-item ${isActive ? 'active' : ''}`
                            }
                        >
                            <span className="nav-item-icon">
                                <item.icon size={20} strokeWidth={2.5} />
                            </span>
                            <span className="nav-item-label">{item.name}</span>
                        </NavLink>
                    ))}
                </div>
            </nav>

            {/*<div className="sidebar-footer">*/}
            {/*    <div className="user-info">*/}
            {/*        <div className="user-avatar">*/}
            {/*            {getUserInitials()}*/}
            {/*        </div>*/}
            {/*        <div className="user-details">*/}
            {/*            <span className="user-name">{user?.name || 'User'}</span>*/}
            {/*            <span className="user-role">{getRoleDisplay()}</span>*/}
            {/*        </div>*/}
            {/*    </div>*/}
            {/*    /!*<div className="logout-button" onClick={handleLogout}>*!/*/}
            {/*    /!*    <span className="logout-icon">🚪</span>*!/*/}
            {/*    /!*    <span className="logout-label">Logout</span>*!/*/}
            {/*    /!*</div>*!/*/}
            {/*</div>*/}
        </div>
    );
};

export default Sidebar;