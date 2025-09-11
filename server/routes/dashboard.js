import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { format, subDays, parseISO } from 'date-fns';

const router = express.Router();

// Get dashboard metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

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

    res.json({
      totalCustomers: totalCustomers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      averageOrderValue
    });
  } catch (error) {
    console.error('Metrics fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch metrics' });
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

// Get top customers
router.get('/top-customers', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('total_spent', { ascending: false })
      .limit(5);

    const result = customers?.map(customer => ({
      id: customer.id,
      name: `${customer.first_name} ${customer.last_name}`,
      email: customer.email,
      totalSpent: parseFloat(customer.total_spent),
      ordersCount: customer.orders_count
    })) || [];

    res.json(result);
  } catch (error) {
    console.error('Top customers fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch top customers' });
  }
});

export default router;