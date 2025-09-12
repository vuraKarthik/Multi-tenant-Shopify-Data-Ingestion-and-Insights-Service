import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from './MetricCard';
import { 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { format as formatDate, subDays, startOfDay, endOfDay } from 'date-fns';
import { DashboardMetrics, OrdersByDate, TopCustomer } from '../types';

interface DashboardProps {
  onSyncStart?: () => void;
  onSyncComplete?: (success: boolean, time: Date) => void;
  syncing?: boolean;
}

export interface DashboardRef {
  triggerSync: () => Promise<boolean>;
}

// Define the Dashboard component with ForwardRef
function Dashboard(props: DashboardProps, ref: React.RefObject<DashboardRef> | ((instance: DashboardRef | null) => void) | null) {
  const { onSyncStart, onSyncComplete, syncing: externalSyncing } = props;
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [ordersByDate, setOrdersByDate] = useState<OrdersByDate[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  // Use external syncing state if provided, otherwise use local state
  const [internalSyncing, setInternalSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  // Determine which syncing state to use
  const syncing = externalSyncing !== undefined ? externalSyncing : internalSyncing;
  const [dateRange, setDateRange] = useState({
    start: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: formatDate(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchDashboardData();
    // Set initial last sync time
    setLastSyncTime(new Date());
  }, [dateRange]);
  
  // Expose triggerSync method to parent component
  useImperativeHandle(ref, () => ({
    triggerSync
  }));
  
  const triggerSync = async () => {
    try {
      // Update local state and notify parent component
      setInternalSyncing(true);
      if (onSyncStart) onSyncStart();
      
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/shopify/sync', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Sync failed');
      }
      
      // Update last sync time
      const syncTime = new Date();
      setLastSyncTime(syncTime);
      
      // Refresh dashboard data
      await fetchDashboardData();
      
      // Notify parent component of success
      if (onSyncComplete) onSyncComplete(true, syncTime);
      
      // Show success message
      alert('Sync completed successfully!');
      return true;
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      
      // Notify parent component of failure
      if (onSyncComplete) onSyncComplete(false, new Date());
      
      alert(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    } finally {
      setInternalSyncing(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [metricsRes, ordersRes, customersRes] = await Promise.all([
        fetch('/api/dashboard/metrics', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/dashboard/orders-by-date?start=${dateRange.start}&end=${dateRange.end}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('/api/dashboard/top-customers', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [metricsData, ordersData, customersData] = await Promise.all([
        metricsRes.json(),
        ordersRes.json(),
        customersRes.json()
      ]);

      setMetrics(metricsData);
      setOrdersByDate(ordersData);
      setTopCustomers(customersData);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      {/* Sync Status */}
       <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm border border-gray-200">
         <div>
           <h2 className="text-lg font-semibold text-gray-900">Shopify Sync Status</h2>
           <p className="text-sm text-gray-500">
             {lastSyncTime ? `Last synced: ${formatDate(lastSyncTime, 'MMM d, yyyy h:mm a')}` : 'Never synced'}
           </p>
         </div>
         <button
           onClick={triggerSync}
           disabled={syncing}
           className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
             syncing ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
           }`}
         >
           <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
           <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
         </button>
       </div>
      {/* Date Range Filter */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1">Monitor your Shopify store performance</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <span className="text-gray-400">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers.toString() || '0'}
          change="+12% from last month"
          changeType="positive"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Total Orders"
          value={metrics?.totalOrders.toString() || '0'}
          change="+8% from last month"
          changeType="positive"
          icon={ShoppingCart}
          loading={loading}
        />
        <MetricCard
          title="Total Revenue"
          value={metrics ? formatCurrency(metrics.totalRevenue) : '$0'}
          change="+15% from last month"
          changeType="positive"
          icon={DollarSign}
          loading={loading}
        />
        <MetricCard
          title="Average Order Value"
          value={metrics ? formatCurrency(metrics.averageOrderValue) : '$0'}
          change="+3% from last month"
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders by Date Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(new Date(value), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value), 'MMM d, yyyy')}
                  formatter={(value: number) => [value, 'Orders']}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  fill="#3B82F6" 
                  fillOpacity={0.1}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue by Date Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Over Time</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ordersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(new Date(value), 'MMM d')}
                />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value), 'MMM d, yyyy')}
                  formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                />
                <Bar dataKey="revenue" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Customers by Spend</h3>
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div>
                    <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div 
                key={customer.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.totalSpent)}</p>
                  <p className="text-sm text-gray-500">{customer.ordersCount} orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Export the Dashboard component with forwardRef
export default forwardRef<DashboardRef, DashboardProps>(Dashboard);