import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from './MetricCard';
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Package,
  Clock
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
  Cell,
  LineChart,
  Line
} from 'recharts';
import { format as formatDate, subDays, parseISO } from 'date-fns';
import { Order } from '../types';
import { fetchFromApi } from '../utils/api';

interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  conversionRate: number;
}

interface OrdersByDate {
  date: string;
  count: number;
  revenue: number;
}

interface OrderStatus {
  name: string;
  value: number;
}

const Orders: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<OrderMetrics | null>(null);
  const [ordersByDate, setOrdersByDate] = useState<OrdersByDate[]>([]);
  const [orderStatuses, setOrderStatuses] = useState<OrderStatus[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: formatDate(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchOrdersData();
  }, [dateRange]);

  const fetchOrdersData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics data
      const metricsData = await fetchFromApi<OrderMetrics>('/orders/metrics');
      
      // Fetch orders by date data
      const ordersByDateData = await fetchFromApi<OrdersByDate[]>(
        `/orders/orders-by-date?start=${dateRange.start}&end=${dateRange.end}`
      );
      
      // Fetch order statuses data
      const orderStatusesData = await fetchFromApi<OrderStatus[]>('/orders/order-statuses');
      
      // Fetch recent orders data
      const recentOrdersData = await fetchFromApi<Order[]>('/orders/recent-orders');

      setMetrics(metricsData);
      setOrdersByDate(ordersByDateData);
      setOrderStatuses(orderStatusesData);
      setRecentOrders(recentOrdersData);
    } catch (error) {
      console.error('Failed to fetch orders data:', error);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your sales performance and order trends</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
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
            onClick={fetchOrdersData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          change="+12% from last month"
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
        <MetricCard
          title="Conversion Rate"
          value={metrics ? `${metrics.conversionRate}%` : '0%'}
          change="+1.5% from last month"
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders Over Time Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders Over Time</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ordersByDate}>
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
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Revenue Over Time Chart */}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Distribution</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderStatuses}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {orderStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Orders']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Orders</h3>
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
              {recentOrders.map((order, index) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                      order.order_status === 'Fulfilled' ? 'bg-green-500' :
                      order.order_status === 'Processing' ? 'bg-blue-500' :
                      order.order_status === 'Pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.shopify_id}</p>
                      <p className="text-sm text-gray-500">{formatDate(new Date(order.created_at), 'MMM d, yyyy')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatCurrency(parseFloat(order.total_price.toString()))}</p>
                    <p className={`text-sm px-2 py-1 rounded-full inline-block ${
                      order.order_status === 'Fulfilled' ? 'bg-green-100 text-green-800' :
                      order.order_status === 'Processing' ? 'bg-blue-100 text-blue-800' :
                      order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                    }`}>{order.order_status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;