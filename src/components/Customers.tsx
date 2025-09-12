import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from './MetricCard';
import { 
  Users, 
  UserPlus,
  Mail,
  Phone,
  TrendingUp
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
import { format as formatDate, subDays, parseISO } from 'date-fns';
import { Customer } from '../types';

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageSpend: number;
}

interface CustomersByDate {
  date: string;
  count: number;
}

interface CustomerSegment {
  name: string;
  value: number;
}

const Customers: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<CustomerMetrics | null>(null);
  const [customersByDate, setCustomersByDate] = useState<CustomersByDate[]>([]);
  const [customerSegments, setCustomerSegments] = useState<CustomerSegment[]>([]);
  const [topCustomers, setTopCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: formatDate(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchCustomersData();
  }, [dateRange]);

  const fetchCustomersData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch metrics data
      const metricsResponse = await fetch('/api/customers/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const metricsData = await metricsResponse.json();
      
      // Fetch customers by date data
      const customersByDateResponse = await fetch(`/api/customers/customers-by-date?start=${dateRange.start}&end=${dateRange.end}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const customersByDateData = await customersByDateResponse.json();
      
      // Fetch customer segments data
      const customerSegmentsResponse = await fetch('/api/customers/customer-segments', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const customerSegmentsData = await customerSegmentsResponse.json();
      
      // Fetch top customers data
      const topCustomersResponse = await fetch('/api/customers/top-customers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const topCustomersData = await topCustomersResponse.json();

      setMetrics(metricsData);
      setCustomersByDate(customersByDateData);
      setCustomerSegments(customerSegmentsData);
      setTopCustomers(topCustomersData);
    } catch (error) {
      console.error('Failed to fetch customers data:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Customer Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your customer acquisition and retention</p>
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
            onClick={fetchCustomersData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Customers"
          value={metrics?.totalCustomers.toString() || '0'}
          change="+8% from last month"
          changeType="positive"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="New Customers"
          value={metrics?.newCustomers.toString() || '0'}
          change="+12% from last month"
          changeType="positive"
          icon={UserPlus}
          loading={loading}
        />
        <MetricCard
          title="Returning Customers"
          value={metrics?.returningCustomers.toString() || '0'}
          change="+5% from last month"
          changeType="positive"
          icon={Users}
          loading={loading}
        />
        <MetricCard
          title="Average Customer Spend"
          value={metrics ? formatCurrency(metrics.averageSpend) : '$0'}
          change="+3% from last month"
          changeType="positive"
          icon={TrendingUp}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* New Customers Over Time Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">New Customers Over Time</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={customersByDate}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => formatDate(new Date(value), 'MMM d')}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(new Date(value), 'MMM d, yyyy')}
                  formatter={(value: number) => [value, 'Customers']}
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

        {/* Customer Segments Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Segments</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={customerSegments}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {customerSegments.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Customers']} />
              </PieChart>
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
                    <p className="font-medium text-gray-900">{`${customer.first_name} ${customer.last_name}`}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{formatCurrency(customer.total_spent)}</p>
                  <p className="text-sm text-gray-500">{customer.orders_count} orders</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;