import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import MainLayout from '../../components/layout/MainLayout/MainLayout';
import Card from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import Badge from '../../components/common/Badge/Badge';
import Icons from '../../components/common/Icons';
import dashboardApi from '../../api/dashboard.api';
import '../../styles/dashboard.css';

const StoreOwnerDashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalStores: 0,
        totalWarehouses: 0,
        totalProducts: 0,
        totalStock: 0,
        totalOffers: 0,
        totalInvoices: 0,
        totalPayments: 0
    });
    const [loading, setLoading] = useState(true);
    const [chartsLoading, setChartsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [revenueData, setRevenueData] = useState([]);
    const [invoiceData, setInvoiceData] = useState([]);
    const [stores, setStores] = useState([]);
    const [period, setPeriod] = useState('monthly');

    useEffect(() => {
        fetchStats();
        fetchChartData();
    }, [period]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await dashboardApi.getStats();
            if (response.success) {
                setStats(response.data);
            } else {
                setError(response.message || 'Failed to fetch stats');
            }
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            setError(typeof error === 'string' ? error : (error.message || 'Error fetching dashboard stats'));
        } finally {
            setLoading(false);
        }
    };

    const fetchChartData = async () => {
        try {
            setChartsLoading(true);
            const response = await dashboardApi.getTrends(period);
            if (response.success && Array.isArray(response.data)) {
                const rawData = response.data;
                
                // Extract unique store names
                const uniqueStores = [...new Set(rawData.map(item => item.storeName))];
                setStores(uniqueStores);

                // Group data by 'name' (the date label)
                const grouped = rawData.reduce((acc, item) => {
                    if (!acc[item.name]) {
                        acc[item.name] = { name: item.name };
                        // Initialize ALL stores to 0 for this date to ensure continuous lines
                        uniqueStores.forEach(s => {
                            acc[item.name][`${s}_rev`] = 0;
                            acc[item.name][`${s}_inv`] = 0;
                        });
                    }
                    acc[item.name][`${item.storeName}_rev`] = item.revenue;
                    acc[item.name][`${item.storeName}_inv`] = item.invoices;
                    return acc;
                }, {});

                const pivotedData = Object.values(grouped);
                setRevenueData(pivotedData);
                setInvoiceData(pivotedData);
            } else {
                setRevenueData([]);
                setInvoiceData([]);
                setStores([]);
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
            setRevenueData([]);
            setInvoiceData([]);
            setStores([]);
        } finally {
            setChartsLoading(false);
        }
    };

    const colors = [
        '#2563eb', // blue
        '#10b981', // emerald
        '#f59e0b', // amber
        '#ef4444', // red
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316'  // orange
    ];

    const getStoreColor = (index) => colors[index % colors.length];

    return (
        <MainLayout>
            <div className="dashboard-container">
                {error && (
                    <div className="error-alert" style={{ 
                        padding: '12px 20px', 
                        backgroundColor: '#fee2e2', 
                        color: '#b91c1c', 
                        borderRadius: '8px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <span><strong>Error:</strong> {error}</span>
                        <Button variant="ghost" size="small" onClick={fetchStats}>Retry</Button>
                    </div>
                )}
                <div className="page-header">
                    <div>
                        <h1>Store Owner Dashboard</h1>
                        <p>Welcome back! Here's your business performance overview.</p>
                    </div>
                    <Button onClick={() => { fetchStats(); fetchChartData(); }} variant="outline" size="small">
                        <Icons.Refresh size={16} style={{ marginRight: '8px' }} /> Refresh
                    </Button>
                </div>

                {/* Store Stats */}
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
                            <p className="stat-value">{loading ? '...' : stats.totalStock.toLocaleString()}</p>
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
                            <p className="stat-value">{loading ? '...' : `$${stats.totalPayments.toLocaleString()}`}</p>
                            <Badge variant="success">Revenue</Badge>
                        </div>
                    </Card>
                </div>

                {/* Charts Section */}
                <div className="charts-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginTop: '24px' }}>
                    
                    {/* Chart 1: Revenue per Store */}
                    <Card className="revenue-chart">
                        <div className="chart-header">
                            <h3>Store-wise Revenue Comparison</h3>
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
                            {chartsLoading ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                    Loading revenue data...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={revenueData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-100)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                                            dy={10}
                                        >
                                            <Label value="Time Duration" offset={-25} position="insideBottom" style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500 }} />
                                        </XAxis>
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'var(--gray-500)', fontSize: 12 }}
                                            tickFormatter={(val) => `$${val}`}
                                        >
                                            <Label value="Sum (Revenue)" angle={-90} position="insideLeft" offset={-5} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                        </YAxis>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--box-shadow)', fontSize: '14px' }}
                                        />
                                        <Legend 
                                            verticalAlign="top"
                                            align="right"
                                            height={36}
                                            iconType="circle"
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
                            )}
                        </div>
                    </Card>

                    {/* Chart 2: Invoices per Store */}
                    <Card className="revenue-chart">
                        <div className="chart-header">
                            <h3>Store-wise Invoice Distribution</h3>
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
                            {chartsLoading ? (
                                <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
                                    Loading invoice stats...
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart
                                        data={invoiceData}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gray-100)" />
                                        <XAxis 
                                            dataKey="name" 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'var(--gray-500)', fontSize: 11 }}
                                            dy={10}
                                        >
                                            <Label value="Time Duration" offset={-25} position="insideBottom" style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500 }} />
                                        </XAxis>
                                        <YAxis 
                                            axisLine={false} 
                                            tickLine={false} 
                                            tick={{ fill: 'var(--gray-500)', fontSize: 12 }}
                                            allowDecimals={false}
                                        >
                                            <Label value="Count (Invoices)" angle={-90} position="insideLeft" offset={-5} style={{ fill: 'var(--gray-400)', fontSize: '11px', fontWeight: 500, textAnchor: 'middle' }} />
                                        </YAxis>
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--box-shadow)', fontSize: '14px' }}
                                        />
                                        <Legend 
                                            verticalAlign="top"
                                            align="right"
                                            height={36}
                                            iconType="circle"
                                        />
                                        {stores.map((store, index) => (
                                            <Line
                                                key={store}
                                                type="monotone"
                                                dataKey={`${store}_inv`}
                                                name={store}
                                                stroke={getStoreColor(index + 2)} // Offset colors for variety
                                                strokeWidth={3}
                                                dot={{ r: 4, strokeWidth: 2 }}
                                                activeDot={{ r: 6, strokeWidth: 0 }}
                                            />
                                        ))}
                                    </LineChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </Card>
                </div>
            </div>
        </MainLayout>
    );
};

export default StoreOwnerDashboard;