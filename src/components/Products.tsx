import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import MetricCard from './MetricCard';
import { 
  Store, 
  Package, 
  TrendingUp,
  Tag,
  ShoppingBag
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
import { Product } from '../types';
import { fetchFromApi } from '../utils/api';

interface ProductMetrics {
  totalProducts: number;
  totalInventory: number;
  lowStockProducts: number;
  averagePrice: number;
}

interface ProductsByCategory {
  name: string;
  value: number;
}

interface ProductPerformance {
  name: string;
  sales: number;
  revenue: number;
}

const Products: React.FC = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<ProductMetrics | null>(null);
  const [productsByCategory, setProductsByCategory] = useState<ProductsByCategory[]>([]);
  const [topProducts, setTopProducts] = useState<ProductPerformance[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: formatDate(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: formatDate(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchProductsData();
  }, [dateRange]);

  const fetchProductsData = async () => {
    try {
      setLoading(true);
      
      // Fetch metrics data
      const metricsData = await fetchFromApi<ProductMetrics>('/products/metrics');
      
      // Fetch products by category data
      const productsByCategoryData = await fetchFromApi<ProductsByCategory[]>('/products/products-by-category');
      
      // Fetch top products data
      const topProductsData = await fetchFromApi<ProductPerformance[]>('/products/top-products');
      
      // Fetch recent products data
      const recentProductsData = await fetchFromApi<Product[]>('/products/recent-products');

      setMetrics(metricsData);
      setProductsByCategory(productsByCategoryData);
      setTopProducts(topProductsData);
      setRecentProducts(recentProductsData);
    } catch (error) {
      console.error('Failed to fetch products data:', error);
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
          <h1 className="text-3xl font-bold text-gray-900">Product Analytics</h1>
          <p className="text-gray-500 mt-1">Monitor your product performance and inventory</p>
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
            onClick={fetchProductsData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span>Apply Filter</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Products"
          value={metrics?.totalProducts.toString() || '0'}
          change="+5% from last month"
          changeType="positive"
          icon={Package}
          loading={loading}
        />
        <MetricCard
          title="Total Inventory"
          value={metrics?.totalInventory.toString() || '0'}
          change="+8% from last month"
          changeType="positive"
          icon={Store}
          loading={loading}
        />
        <MetricCard
          title="Low Stock Products"
          value={metrics?.lowStockProducts.toString() || '0'}
          change="-3% from last month"
          changeType="negative"
          icon={ShoppingBag}
          loading={loading}
        />
        <MetricCard
          title="Average Price"
          value={metrics ? formatCurrency(metrics.averagePrice) : '$0'}
          change="+2% from last month"
          changeType="positive"
          icon={Tag}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products by Category Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Products by Category</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={productsByCategory}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {productsByCategory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [value, 'Products']} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top Products Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 Products by Sales</h3>
          {loading ? (
            <div className="h-80 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topProducts}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip formatter={(value: number, name) => [
                  name === 'sales' ? value : formatCurrency(value),
                  name === 'sales' ? 'Units Sold' : 'Revenue'
                ]} />
                <Bar dataKey="sales" fill="#3B82F6" name="Units Sold" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recently Added Products</h3>
        {loading ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-16"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-12"></div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-4 bg-gray-200 rounded w-20"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.title}</div>
                          <div className="text-sm text-gray-500">#{product.shopify_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.product_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.vendor}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        product.inventory_quantity > 100 ? 'bg-green-100 text-green-800' :
                        product.inventory_quantity > 20 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inventory_quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(new Date(product.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;