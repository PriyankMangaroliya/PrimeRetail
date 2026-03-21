import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Login from '../modules/Auth/Login';
import PrivateRoute from './PrivateRoute';
import SuperAdminDashboard from '../modules/Dashboard/SuperAdminDashboard';
import Roles from '../modules/Roles/Roles';
import StoreOwnerDashboard from '../modules/Dashboard/StoreOwnerDashboard';
import StoreManagerDashboard from '../modules/Dashboard/StoreManagerDashboard';
import CashierDashboard from '../modules/Dashboard/CashierDashboard';
import InventoryStaffDashboard from '../modules/Dashboard/InventoryStaffDashboard';
import WarehouseStaffDashboard from '../modules/Dashboard/WarehouseStaffDashboard';
import Profile from '../modules/Auth/Profile';
import NotFound from '../modules/Error/NotFound';
import ServerError from '../modules/Error/ServerError';
import StoreOwners from '../modules/StoreOwners/StoreOwners';
import Taxes from '../modules/Taxes/Taxes';
import PaymentMethods from '../modules/PaymentMethods/PaymentMethods';
import Stores from '../modules/Stores/Stores';
import Warehouses from '../modules/Warehouses/Warehouses';
import Employees from '../modules/Employees/Employees';
import Discounts from '../modules/Discounts/Discounts';
import Products from '../modules/Products/Products';
import Category from '../modules/Products/Category';
import StoreTaxes from '../modules/Taxes/StoreTaxes.jsx';
import StockList from '../modules/Inventory/StockList';
import TransactionHistory from '../modules/Inventory/TransactionHistory';


const AppRoutes = () => {
    const { isAuthenticated, user } = useAuth();

    const getDashboardRoute = () => {
        if (!user) return '/login';

        switch (user.role_name) {
            case 'Super Admin':
                return '/admin/dashboard';
            case 'Store Owner':
                return '/owner/dashboard';
            case 'Store Manager':
                return '/manager/dashboard';
            case 'Cashier':
                return '/cashier/dashboard';
            case 'Inventory Staff':
                return '/inventory/dashboard';
            case 'Warehouse Staff':
                return '/warehouse/dashboard';
            default:
                return '/dashboard';
        }
    };

    return (<Routes>
        {/* Public Routes */}
        <Route
            path="/login"
            element={
                isAuthenticated ? <Navigate to={getDashboardRoute()} replace /> : <Login />
            }
        />

        {/* Protected Routes */}
        <Route
            path="/profile"
            element={<PrivateRoute>
                <Profile />
            </PrivateRoute>}
        />

        <Route
            path="/dashboard"
            element={<PrivateRoute>
                <Navigate to={getDashboardRoute()} replace />
            </PrivateRoute>}
        />

        {/* Super Admin Routes */}
        <Route
            path="/admin/dashboard"
            element={<PrivateRoute allowedRoles={['Super Admin']}>
                <SuperAdminDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/admin/roles"
            element={<PrivateRoute allowedRoles={['Super Admin']}>
                <Roles />
            </PrivateRoute>}
        />

        <Route
            path="/admin/store-owners"
            element={<PrivateRoute allowedRoles={['Super Admin']}>
                <StoreOwners />
            </PrivateRoute>}
        />

        <Route
            path="/admin/taxes"
            element={<PrivateRoute allowedRoles={['Super Admin']}>
                <Taxes />
            </PrivateRoute>}
        />

        <Route
            path="/admin/payment-methods"
            element={<PrivateRoute allowedRoles={['Super Admin']}>
                <PaymentMethods />
            </PrivateRoute>}
        />

        {/* Store Owner Routes */}
        <Route
            path="/owner/dashboard"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <StoreOwnerDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/owner/stores"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Stores />
            </PrivateRoute>}
        />

        <Route
            path="/owner/warehouse"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Warehouses />
            </PrivateRoute>}
        />

        <Route
            path="/owner/employees"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Employees />
            </PrivateRoute>}
        />

        <Route
            path="/owner/taxes"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <StoreTaxes />
            </PrivateRoute>}
        />

        <Route
            path="/owner/discounts"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Discounts />
            </PrivateRoute>}
        />

        <Route
            path="/owner/category"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Category />
            </PrivateRoute>}
        />

        <Route
            path="/owner/products"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <Products />
            </PrivateRoute>}
        />

        <Route
            path="/owner/stock"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <StockList />
            </PrivateRoute>}
        />

        <Route
            path="/owner/transactions"
            element={<PrivateRoute allowedRoles={['Store Owner']}>
                <TransactionHistory />
            </PrivateRoute>}
        />

        {/* Store Manager Routes */}
        <Route
            path="/manager/dashboard"
            element={<PrivateRoute allowedRoles={['Store Manager']}>
                <StoreManagerDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/manager/employees"
            element={<PrivateRoute allowedRoles={['Store Manager']}>
                <Employees />
            </PrivateRoute>}
        />

        <Route
            path="/manager/products"
            element={<PrivateRoute allowedRoles={['Store Manager']}>
                <Products />
            </PrivateRoute>}
        />

        <Route
            path="/manager/stock"
            element={<PrivateRoute allowedRoles={['Store Manager']}>
                <StockList />
            </PrivateRoute>}
        />

        <Route
            path="/manager/transactions"
            element={<PrivateRoute allowedRoles={['Store Manager']}>
                <TransactionHistory />
            </PrivateRoute>}
        />

        {/* Cashier Routes */}
        <Route
            path="/cashier/dashboard"
            element={<PrivateRoute allowedRoles={['Cashier']}>
                <CashierDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/cashier/products"
            element={<PrivateRoute allowedRoles={['Cashier']}>
                <Products />
            </PrivateRoute>}
        />

        <Route
            path="/cashier/stock"
            element={<PrivateRoute allowedRoles={['Cashier']}>
                <StockList />
            </PrivateRoute>}
        />

        <Route
            path="/cashier/transactions"
            element={<PrivateRoute allowedRoles={['Cashier']}>
                <TransactionHistory />
            </PrivateRoute>}
        />

        {/* Inventory Staff Routes */}
        <Route
            path="/inventory/dashboard"
            element={<PrivateRoute allowedRoles={['Inventory Staff']}>
                <InventoryStaffDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/inventory/products"
            element={<PrivateRoute allowedRoles={['Inventory Staff']}>
                <Products />
            </PrivateRoute>}
        />

        <Route
            path="/inventory/stock"
            element={<PrivateRoute allowedRoles={['Inventory Staff']}>
                <StockList />
            </PrivateRoute>}
        />

        <Route
            path="/inventory/transactions"
            element={<PrivateRoute allowedRoles={['Inventory Staff']}>
                <TransactionHistory />
            </PrivateRoute>}
        />

        {/* Warehouse Staff Routes */}
        <Route
            path="/warehouse/dashboard"
            element={<PrivateRoute allowedRoles={['Warehouse Staff']}>
                <WarehouseStaffDashboard />
            </PrivateRoute>}
        />

        <Route
            path="/warehouse/products"
            element={<PrivateRoute allowedRoles={['Warehouse Staff']}>
                <Products />
            </PrivateRoute>}
        />

        <Route
            path="/warehouse/stock"
            element={<PrivateRoute allowedRoles={['Warehouse Staff']}>
                <StockList />
            </PrivateRoute>}
        />

        <Route
            path="/warehouse/transactions"
            element={<PrivateRoute allowedRoles={['Warehouse Staff']}>
                <TransactionHistory />
            </PrivateRoute>}
        />

        {/* Error Pages */}
        <Route path="/500" element={<ServerError />} />

        {/* 404 - This should be the last route */}
        <Route path="*" element={<NotFound />} />
    </Routes>);
};

export default AppRoutes;