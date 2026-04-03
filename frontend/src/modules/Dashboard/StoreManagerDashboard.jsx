import React, { useState, useEffect, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

const StoreManagerDashboard = () => {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalStock: 0,
        totalInvoices: 0,
        totalPayments: 0
    });
    const [loading, setLoading] = useState(true);
    const [trends, setTrends] = useState([]);
    const [trendsLoading, setTrendsLoading] = useState(true);
    const [period, setPeriod] = useState('monthly');



    /* ── fetch stats ─────────────────────────────────────────────── */
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getStats();
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── fetch revenue trends ────────────────────────────────────── */
    const fetchTrends = useCallback(async () => {
        try {
            setTrendsLoading(true);
            const response = await dashboardApi.getStoreTrends(period);
            if (response.success && Array.isArray(response.data)) {
                // Ensure every row has numeric 0 fallbacks
                const normalized = response.data.map(row => ({
                    name: row.name,
                    revenue: parseFloat(row.revenue) || 0,
                    invoices: parseInt(row.invoices, 10) || 0,
                }));
                setTrends(normalized);
            } else {
                setTrends([]);
            }
        } catch (error) {
            console.error('Error fetching trend data:', error);
            setTrends([]);
        } finally {
            setTrendsLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchTrends(); }, [fetchTrends]);

    return (
        <MainLayout>
            <div className="dashboard-container">
                <div className="page-header">
                    <div>
                        <h1>Store Manager Dashboard</h1>
                        <p>Manage your store operations efficiently.</p>
                    </div>
                    <Button onClick={() => { fetchStats(); fetchTrends(); }} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Quick Stats */}
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
                            <p className="stat-value">{loading ? '...' : (stats.totalStock || 0).toLocaleString()}</p>
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
                            <p className="stat-value">{loading ? '...' : `₹${(stats.totalPayments || 0).toLocaleString()}`}</p>
                            <Badge variant="success">Revenue</Badge>
                        </div>
                    </Card>
                </div>

                {/* Revenue Bar Chart */}
                <Card className="revenue-chart">
                    <div className="chart-header">
                        <h3>Store Revenue Overview</h3>
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
                        </div>
                    </div>

                    <div className="chart-container" style={{ width: '100%', height: 350 }}>
                        {trendsLoading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                Loading revenue data...
                            </div>
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" key={period}>
                                <BarChart
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
                                        tickFormatter={(val) => val >= 1000 ? `₹${(val / 1000).toFixed(1)}k` : `₹${val}`}
                                        dx={-10}
                                    >
                                        <Label value="Total Revenue" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                    </YAxis>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: 'var(--box-shadow)',
                                            fontSize: '14px'
                                        }}
                                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={48}
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                                    />
                                    <Bar
                                        dataKey="revenue"
                                        name="Revenue"
                                        fill="var(--primary-color)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
                                <Icons.AlertCircle size={20} style={{ marginRight: '8px' }} />
                                No revenue data available for this period.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Invoice Count Bar Chart */}
                <Card className="revenue-chart" style={{ marginTop: '24px' }}>
                    <div className="chart-header">
                        <h3>Invoice Count Overview</h3>
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
                        </div>
                    </div>

                    <div className="chart-container" style={{ width: '100%', height: 350 }}>
                        {trendsLoading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                Loading invoice data...
                            </div>
                        ) : trends.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" key={`bar-${period}`}>
                                <BarChart
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
                                        <Label value="Total Invoices" angle={-90} position="insideLeft" offset={0} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                    </YAxis>
                                    <Tooltip
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow: 'var(--box-shadow)',
                                            fontSize: '14px'
                                        }}
                                        formatter={(value) => [value, 'Invoices']}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={48}
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                                    />
                                    <Bar
                                        dataKey="invoices"
                                        name="Invoices"
                                        fill="var(--success-color)"
                                        radius={[4, 4, 0, 0]}
                                        maxBarSize={40}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
                                <Icons.AlertCircle size={20} style={{ marginRight: '8px' }} />
                                No invoice data available for this period.
                            </div>
                        )}
                    </div>
                </Card>


            </div>
        </MainLayout>
    );
};

export default StoreManagerDashboard;