import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

const SuperAdminDashboard = () => {
    const [stats, setStats] = useState({
        totalStoreOwners: 0,
        totalUsers: 0,
        totalStores: 0,
        totalWarehouses: 0
    });
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        fetchStats();
    }, []);

    useEffect(() => {
        fetchTrends();
    }, [period]);

    const fetchStats = async () => {
        try {
            setStatsLoading(true);
            const response = await dashboardApi.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setStatsLoading(false);
        }
    };

    const fetchTrends = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getTrends(period);
            setTrends(response.data);
        } catch (error) {
            console.error('Error fetching dashboard trends:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Super Admin Dashboard</h1>
                        <p>Welcome back, Super Admin! Here's your system overview.</p>
                    </div>
                    <Button onClick={() => { fetchStats(); fetchTrends(); }} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Users size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Store Owners</h3>
                            <p className="stat-value">{statsLoading ? '...' : stats.totalStoreOwners}</p>
                            <Badge variant="success">Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Users size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Users</h3>
                            <p className="stat-value">{statsLoading ? '...' : stats.totalUsers}</p>
                            <Badge variant="success">Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.Store size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stores</h3>
                            <p className="stat-value">{statsLoading ? '...' : stats.totalStores}</p>
                            <Badge variant="info">Global</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon warning"><Icons.Warehouse size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Warehouses</h3>
                            <p className="stat-value">{statsLoading ? '...' : stats.totalWarehouses}</p>
                            <Badge variant="info">Global</Badge>
                        </div>
                    </Card>
                </div>

                {/* System Growth Line Chart */}
                <Card className="revenue-chart">
                    <div className="chart-header">
                        <h3>System Growth Overview</h3>
                        <div className="chart-actions">
                            <Button
                                variant={period === 'monthly' ? 'primary' : 'outline'}
                                size="small"
                                onClick={() => setPeriod('monthly')}
                            >
                                Monthly
                            </Button>
                            <Button
                                variant={period === 'yearly' ? 'primary' : 'outline'}
                                size="small"
                                onClick={() => setPeriod('yearly')}
                            >
                                Yearly
                            </Button>
                            <Button
                                variant={period === 'all' ? 'primary' : 'outline'}
                                size="small"
                                onClick={() => setPeriod('all')}
                            >
                                All Time
                            </Button>
                        </div>
                    </div>

                    <div className="chart-container" style={{ width: '100%', height: 350 }}>
                        {loading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                Loading growth data...
                            </div>
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" key={period}>
                                <LineChart
                                    data={trends}
                                    margin={{ top: 10, right: 30, left: 20, bottom: 25 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-100)" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--gray-500)', fontSize: 10 }}
                                        minTickGap={30}
                                        dy={10}
                                    >
                                        <Label value="Time Duration" angle={0} position="bottom" offset={12} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                    </XAxis>
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: 'var(--gray-500)', fontSize: 12 }}
                                        allowDecimals={false}
                                        tickFormatter={(val) => Math.round(val)}
                                        dx={-10}
                                    >
                                        <Label value="Total Count" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                    </YAxis>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: 'var(--box-shadow)',
                                            fontSize: '14px'
                                        }}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={48}
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="storeOwners"
                                        name="Store Owners"
                                        stroke="var(--primary-color)"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="stores"
                                        name="Stores"
                                        stroke="var(--success-color)"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="warehouses"
                                        name="Warehouses"
                                        stroke="var(--warning-color)"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6, strokeWidth: 0 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
                                <Icons.AlertCircle size={20} style={{ marginRight: '8px' }} />
                                No growth data available for this period.
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </MainLayout>
    );
};

export default SuperAdminDashboard;
