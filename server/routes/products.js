import express from 'express';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { format, subDays, parseISO } from 'date-fns';

const router = express.Router();

// Get product metrics
router.get('/metrics', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    // Get total products
    const { count: totalProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId);

    // Get total inventory
    const { data: products } = await supabase
      .from('products')
      .select('inventory_quantity')
      .eq('tenant_id', tenantId);

    const totalInventory = products?.reduce((sum, product) => sum + product.inventory_quantity, 0) || 0;
    
    // Get low stock products (inventory less than 10)
    const { count: lowStockProducts } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .lt('inventory_quantity', 10);

    // Get average price
    const totalPrice = products?.reduce((sum, product) => sum + parseFloat(product.price), 0) || 0;
    const averagePrice = totalProducts > 0 ? totalPrice / totalProducts : 0;

    res.json({
      totalProducts: totalProducts || 0,
      totalInventory,
      lowStockProducts: lowStockProducts || 0,
      averagePrice
    });
  } catch (error) {
    console.error('Product metrics fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch product metrics' });
  }
});

// Get products by category
router.get('/products-by-category', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;

    const { data: products } = await supabase
      .from('products')
      .select('product_type')
      .eq('tenant_id', tenantId);

    // Count products by category
    const categoryCounts = {};
    products?.forEach(product => {
      const category = product.product_type || 'Uncategorized';
      if (!categoryCounts[category]) {
        categoryCounts[category] = 0;
      }
      categoryCounts[category] += 1;
    });

    // Convert to array format for charts
    const result = Object.entries(categoryCounts).map(([name, value]) => ({
      name,
      value
    }));

    res.json(result);
  } catch (error) {
    console.error('Products by category fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch products by category' });
  }
});

// Get top products by sales
// Note: This would typically require joining orders and products tables
// For this example, we'll return a placeholder response
router.get('/top-products', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = req.query.limit || 5;

    // In a real application, you would join orders and products tables
    // to calculate sales and revenue per product
    // For this example, we'll return the most recently added products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Transform to the expected format
    const result = products?.map(product => ({
      name: product.title,
      sales: Math.floor(Math.random() * 100) + 10, // Placeholder
      revenue: parseFloat(product.price) * (Math.floor(Math.random() * 100) + 10) // Placeholder
    })) || [];

    res.json(result);
  } catch (error) {
    console.error('Top products fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch top products' });
  }
});

// Get recent products
router.get('/recent-products', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    const limit = req.query.limit || 5;

    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    res.json(products || []);
  } catch (error) {
    console.error('Recent products fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch recent products' });
  }
});

export default router;