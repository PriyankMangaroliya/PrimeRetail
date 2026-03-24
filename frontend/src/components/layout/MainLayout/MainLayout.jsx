import React from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Navbar from '../Navbar/Navbar';
import './MainLayout.css'
import '../../../styles/global.css'

const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
            <Sidebar />
            <div className="main-content">
                <Navbar />
                <main className="page-content">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default MainLayout;