import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { format, subDays, parseISO } from 'date-fns';

const router = express.Router();

// Get order metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get total orders
    const { count: totalOrders } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get total revenue
    const { data: orders } = await supabase
      .from('orders')
      .select('total_price')
      .eq('tenant_id', tenantId);

    const totalRevenue = orders?.reduce((sum, order) => sum + parseFloat(order.total_price), 0) || 0;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // For conversion rate, we would need additional data like total visitors
    // For this example, we'll use a placeholder value
    const conversionRate = 3.2; // Placeholder

    res.json({
      totalOrders: totalOrders || 0,
      totalRevenue,
      averageOrderValue,
      conversionRate
    });
  } catch (error) {
    console.error('Order metrics fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch order metrics' });
  }
});

// Get orders by date
router.get('/orders-by-date', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { start, end } = req.query;

    const startDate = start || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const endDate = end || format(new Date(), 'yyyy-MM-dd');

    const { data: orders } = await supabase
      .from('orders')
      .select('created_at, total_price')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59.999Z')
      .order('created_at');

    // Group orders by date
    const ordersByDate = {};
    orders?.forEach(order => {
      const date = format(parseISO(order.created_at), 'yyyy-MM-dd');
      if (!ordersByDate[date]) {
        ordersByDate[date] = { count: 0, revenue: 0 };
      }
      ordersByDate[date].count += 1;
      ordersByDate[date].revenue += parseFloat(order.total_price);
    });

    // Convert to array format for charts
    const result = Object.entries(ordersByDate).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue
    }));

    res.json(result);
  } catch (error) {
    console.error('Orders by date fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch orders by date' });
  }
});

// Get order status distribution
router.get('/order-statuses', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const { data: orders } = await supabase
      .from('orders')
      .select('order_status')
      .eq('tenant_id', tenantId);

    // Count orders by status
    const statusCounts = {};
    orders?.forEach(order => {
      const status = order.order_status;
      if (!statusCounts[status]) {
        statusCounts[status] = 0;
      }
      statusCounts[status] += 1;
    });

    // Convert to array format for charts
    const result = Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));

    res.json(result);
  } catch (error) {
    console.error('Order statuses fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch order statuses' });
  }
});

// Get recent orders
router.get('/recent-orders', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = req.query.limit || 5;

    const { data: orders } = await supabase
      .from('orders')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    res.json(orders || []);
  } catch (error) {
    console.error('Recent orders fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch recent orders' });
  }
});

export default router;