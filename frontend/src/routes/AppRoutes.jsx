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
import StoreTaxes from '../modules/Taxes/storeTaxes';



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

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    isAuthenticated ?
                        <Navigate to={getDashboardRoute()} replace /> :
                        <Login />
                }
            />

            {/* Protected Routes */}
            <Route
                path="/profile"
                element={
                    <PrivateRoute>
                        <Profile />
                    </PrivateRoute>
                }
            />

            <Route
                path="/dashboard"
                element={
                    <PrivateRoute>
                        <SuperAdminDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Super Admin']}>
                        <SuperAdminDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/roles"
                element={
                    <PrivateRoute allowedRoles={['Super Admin']}>
                        <Roles />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/store-owners"
                element={
                    <PrivateRoute allowedRoles={['Super Admin']}>
                        <StoreOwners />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/taxes"
                element={
                    <PrivateRoute allowedRoles={['Super Admin']}>
                        <Taxes />
                    </PrivateRoute>
                }
            />

            <Route
                path="/admin/payment-methods"
                element={
                    <PrivateRoute allowedRoles={['Super Admin']}>
                        <PaymentMethods />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <StoreOwnerDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/stores"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <Stores />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/warehouse"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <Warehouses />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/employees"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <Employees />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/discounts"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <Discounts />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/taxes"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <StoreTaxes />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/products"
                element={
                    <PrivateRoute allowedRoles={['Store Owner']}>
                        <Products defaultTab="products" />
                    </PrivateRoute>
                }
            />

            <Route
                path="/owner/category"
                element={
                    <PrivateRoute allowedRoles={['Store Owner', 'Store Manager', 'Cashier', 'Inventory Staff', 'Warehouse Staff']}>
                        <Category />
                    </PrivateRoute>
                }
            />

            <Route
                path="/manager/employees"
                element={
                    <PrivateRoute allowedRoles={['Store Manager']}>
                        <Employees />
                    </PrivateRoute>
                }
            />

            <Route
                path="/manager/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Store Manager']}>
                        <StoreManagerDashboard />
                    </PrivateRoute>
                }
            />


            <Route
                path="/cashier/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Cashier']}>
                        <CashierDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/inventory/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Inventory Staff']}>
                        <InventoryStaffDashboard />
                    </PrivateRoute>
                }
            />

            <Route
                path="/warehouse/dashboard"
                element={
                    <PrivateRoute allowedRoles={['Warehouse Staff']}>
                        <WarehouseStaffDashboard />
                    </PrivateRoute>
                }
            />

            {/* Error Pages */}
            <Route path="/500" element={<ServerError />} />

            {/* 404 - This should be the last route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;