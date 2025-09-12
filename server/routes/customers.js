import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { format, subDays, parseISO } from 'date-fns';

const router = express.Router();

// Get customer metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get total customers
    const { count: totalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get new customers (last 30 days)
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { count: newCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo);

    // Get returning customers (with more than 1 order)
    const { data: returningCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gt('orders_count', 1);

    // Get average spend
    const { data: customers } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('tenant_id', tenantId);

    const totalSpent = customers?.reduce((sum, customer) => sum + parseFloat(customer.total_spent), 0) || 0;
    const averageSpend = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    res.json({
      totalCustomers: totalCustomers || 0,
      newCustomers: newCustomers || 0,
      returningCustomers: returningCustomers?.length || 0,
      averageSpend
    });
  } catch (error) {
    console.error('Customer metrics fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch customer metrics' });
  }
});

// Get customers by date
router.get('/customers-by-date', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const { start, end } = req.query;

    const startDate = start || format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const endDate = end || format(new Date(), 'yyyy-MM-dd');

    const { data: customers } = await supabase
      .from('customers')
      .select('created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', startDate)
      .lte('created_at', endDate + 'T23:59:59.999Z')
      .order('created_at');

    // Group customers by date
    const customersByDate = {};
    customers?.forEach(customer => {
      const date = format(parseISO(customer.created_at), 'yyyy-MM-dd');
      if (!customersByDate[date]) {
        customersByDate[date] = { count: 0 };
      }
      customersByDate[date].count += 1;
    });

    // Convert to array format for charts
    const result = Object.entries(customersByDate).map(([date, data]) => ({
      date,
      count: data.count
    }));

    res.json(result);
  } catch (error) {
    console.error('Customers by date fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch customers by date' });
  }
});

// Get customer segments
router.get('/customer-segments', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get new customers (last 30 days)
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { count: newCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', thirtyDaysAgo);

    // Get returning customers (with 2-5 orders)
    const { count: returningCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('orders_count', 2)
      .lte('orders_count', 5);

    // Get loyal customers (with more than 5 orders)
    const { count: loyalCustomers } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gt('orders_count', 5);

    const segments = [
      { name: 'New', value: newCustomers || 0 },
      { name: 'Returning', value: returningCustomers || 0 },
      { name: 'Loyal', value: loyalCustomers || 0 }
    ];

    res.json(segments);
  } catch (error) {
    console.error('Customer segments fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch customer segments' });
  }
});

// Get top customers
router.get('/top-customers', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = req.query.limit || 5;

    const { data: customers } = await supabase
      .from('customers')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('total_spent', { ascending: false })
      .limit(limit);

    res.json(customers || []);
  } catch (error) {
    console.error('Top customers fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch top customers' });
  }
});

export default router;