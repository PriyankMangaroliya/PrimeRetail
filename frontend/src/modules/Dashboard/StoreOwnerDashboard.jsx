import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

/* ── Store colour palette (one distinct colour per store line) ─────── */
const STORE_COLORS = [
    'var(--primary-color)',  // index 0
    'var(--success-color)',  // index 1
    'var(--warning-color)',  // index 2
    '#ef4444',               // red
    '#8b5cf6',               // violet
    '#ec4899',               // pink
    '#06b6d4',               // cyan
    '#f97316',               // orange
];
const getStoreColor = (index) => STORE_COLORS[index % STORE_COLORS.length];

/* ══════════════════════════════════════════════════════════════════════ */
const StoreOwnerDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStores: 0,
        totalWarehouses: 0,
        totalProducts: 0,
        totalStock: 0,
        totalOffers: 0,
        totalInvoices: 0,
        totalPayments: 0,
    });
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [error, setError] = useState(null);

    /* chart state */
    const [revenueData, setRevenueData] = useState([]);
    const [invoiceData, setInvoiceData] = useState([]);
    const [stores, setStores] = useState([]);   // unique store names
    const [period, setPeriod] = useState('monthly');

    /* ── fetch stats ─────────────────────────────────────────────── */
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardApi.getStats();
            if (response.success) setStats(response.data);
            else setError(response.message || 'Failed to fetch stats');
        } catch (err) {
            console.error('Error fetching dashboard stats:', err);
            setError(typeof err === 'string' ? err : (err.message || 'Error fetching stats'));
        } finally {
            setLoading(false);
        }
    }, []);

    /* ── fetch chart data ────────────────────────────────────────── */
    const fetchChartData = useCallback(async () => {
        try {
            setChartsLoading(true);
            const response = await dashboardApi.getStoreOwnerTrends(period);

            if (response.success && Array.isArray(response.data) && response.data.length > 0) {
                const rawData = response.data;

                // unique store names in alphabetical order (API already sorted)
                const uniqueStores = [...new Map(
                    rawData
                        .filter(item => item && item.storeName)
                        .map(item => [item.storeName, item.storeName])
                ).keys()];
                setStores(uniqueStores);

                // pivot: one row per x-label, one column per store
                // Pre-fill ALL date labels with 0 for ALL stores first,
                // then overwrite with actual values — guarantees no gaps.
                const grouped = {};

                // First pass: collect all date labels
                rawData.forEach((item) => {
                    if (!item.name) return;
                    if (!grouped[item.name]) {
                        grouped[item.name] = { name: item.name };
                        // pre-fill every store with 0 for this date
                        uniqueStores.forEach(s => {
                            grouped[item.name][`${s}_rev`] = 0;
                            grouped[item.name][`${s}_inv`] = 0;
                        });
                    }
                });

                // Second pass: write actual values (null/undefined fall back to 0)
                rawData.forEach((item) => {
                    if (!item.name || !item.storeName) return;
                    grouped[item.name][`${item.storeName}_rev`] = parseFloat(item.revenue) || 0;
                    grouped[item.name][`${item.storeName}_inv`] = parseInt(item.invoices, 10) || 0;
                });

                const pivoted = Object.values(grouped);
                setRevenueData(pivoted);
                setInvoiceData(pivoted);
            } else {
                setRevenueData([]);
                setInvoiceData([]);
                setStores([]);
            }
        } catch (err) {
            console.error('Error fetching chart data:', err);
            setRevenueData([]);
            setInvoiceData([]);
            setStores([]);
        } finally {
            setChartsLoading(false);
        }
    }, [period]);

    useEffect(() => { fetchStats(); }, [fetchStats]);
    useEffect(() => { fetchChartData(); }, [fetchChartData]);

    /* ── shared period toggle (rendered inside each chart header) ─── */
    const PeriodToggle = () => (
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
    );

    /* ── x-axis label ─────────────────────────────────────────────── */
    const xLabel = period === 'monthly' ? 'Time Duration' : 'Time Duration';

    /* ════════════════════════════════════════════════════════════════ */
    return (
        <MainLayout>
            <div className="dashboard-container">

                {/* Error banner */}
                {error && (
                    <div className="error-alert" style={{
                        padding: '12px 20px', background: '#fee2e2', color: '#b91c1c',
                        borderRadius: 8, marginBottom: 20,
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <span><strong>Error:</strong> {error}</span>
                        <Button variant="ghost" size="small" onClick={fetchStats}>Retry</Button>
                    </div>
                )}

                {/* Page header */}
                <div className="page-header">
                    <div>
                        <h1>Store Owner Dashboard</h1>
                        <p>Welcome back! Here's your business performance overview.</p>
                    </div>
                    <Button onClick={() => { fetchStats(); fetchChartData(); }} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Users size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Users</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalUsers}</p>
                            <Badge variant="success">Staff</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Store size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stores</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalStores}</p>
                            <Badge variant="success">Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Warehouse size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Warehouses</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalWarehouses}</p>
                            <Badge variant="info">Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.Package size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Products</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalProducts}</p>
                            <Badge variant="warning">Catalog</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon success"><Icons.BarChart size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Stock</h3>
                            <p className="stat-value">{loading ? '...' : (stats.totalStock || 0).toLocaleString()}</p>
                            <Badge variant="success">In Hand</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon warning"><Icons.Zap size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Offers</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalOffers}</p>
                            <Badge variant="warning">Active</Badge>
                        </div>
                    </Card>

                    <Card className="stat-card">
                        <div className="stat-icon primary"><Icons.FileText size={24} /></div>
                        <div className="stat-content">
                            <h3>Total Invoices</h3>
                            <p className="stat-value">{loading ? '...' : stats.totalInvoices}</p>
                            <Badge variant="success">Sales</Badge>
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

                {/* ── Chart 1: Revenue per Store ───────────────────────────── */}
                <Card className="revenue-chart">
                    <div className="chart-header">
                        <h3>Store-wise Revenue Comparison</h3>
                        <PeriodToggle />
                    </div>

                    <div className="chart-container" style={{ width: '100%', height: 350 }}>
                        {chartsLoading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                Loading revenue data...
                            </div>
                        ) : revenueData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" key={`revenue-${period}`}>
                                <LineChart
                                    data={revenueData}
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
                                        <Label value={xLabel} angle={0} position="bottom" offset={12} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
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
                                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, undefined]}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={48}
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                                    />
                                    {stores.map((store, index) => (
                                        <Line
                                            key={store}
                                            type="monotone"
                                            dataKey={`${store}_rev`}
                                            name={store}
                                            stroke={getStoreColor(index)}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    ))}
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)', fontSize: '14px' }}>
                                <Icons.AlertCircle size={20} style={{ marginRight: '8px' }} />
                                No revenue data available for this period.
                            </div>
                        )}
                    </div>
                </Card>

                {/* ── Chart 2: Invoices per Store ─────────────────────────── */}
                <Card className="revenue-chart" style={{ marginTop: '24px' }}>
                    <div className="chart-header">
                        <h3>Store-wise Invoice Distribution</h3>
                        <PeriodToggle />
                    </div>

                    <div className="chart-container" style={{ width: '100%', height: 350 }}>
                        {chartsLoading ? (
                            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                Loading invoice stats...
                            </div>
                        ) : invoiceData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" key={`invoice-${period}`}>
                                <LineChart
                                    data={invoiceData}
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
                                        <Label value={xLabel} angle={0} position="bottom" offset={12} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
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
                                        formatter={(value) => [value, undefined]}
                                    />
                                    <Legend
                                        verticalAlign="top"
                                        align="right"
                                        height={48}
                                        iconType="circle"
                                        wrapperStyle={{ paddingTop: '10px', fontSize: '13px' }}
                                    />
                                    {stores.map((store, index) => (
                                        <Line
                                            key={store}
                                            type="monotone"
                                            dataKey={`${store}_inv`}
                                            name={store}
                                            stroke={getStoreColor(index)}
                                            strokeWidth={3}
                                            dot={{ r: 4, strokeWidth: 2 }}
                                            activeDot={{ r: 6, strokeWidth: 0 }}
                                        />
                                    ))}
                                </LineChart>
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

export default StoreOwnerDashboard;