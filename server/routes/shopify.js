import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { syncShopifyData, testShopifyConnection } from '../services/shopify.js';
import { supabase } from '../config/database.js';

const router = express.Router();

// Trigger manual sync
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    console.log(`Manual sync triggered for tenant: ${tenantId}`);
    
    // Get tenant info first to verify connection
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Test connection before syncing
    console.log(`Testing connection to Shopify store: ${tenant.shop_domain}`);
    const connectionTest = await testShopifyConnection(tenant.shop_domain, tenant.access_token);
    
    if (!connectionTest.success) {
      console.error('Shopify connection failed:', connectionTest.error);
      return res.status(400).json({ 
        message: 'Failed to connect to Shopify store', 
        error: connectionTest.error 
      });
    }
    
    console.log('Shopify connection successful, starting sync...');
    await syncShopifyData(tenantId);
    
    res.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ message: 'Sync failed' });
  }
});

// Debug endpoint to check tenants
router.get('/debug/tenants', async (req, res) => {
  try {
    console.log('Fetching all tenants for debugging');
    
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id, email, shop_domain');

    if (error) {
      console.error('Failed to fetch tenants:', error);
      return res.status(500).json({ message: 'Failed to fetch tenants' });
    }

    console.log(`Found ${tenants?.length || 0} tenants in database`);
    res.json({ count: tenants?.length || 0, tenants });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ message: 'Error in debug endpoint' });
  }
});

// Debug endpoint to force sync for a tenant
router.get('/debug/force-sync/:tenantId', async (req, res) => {
  try {
    const { tenantId } = req.params;
    console.log(`Force sync triggered for tenant: ${tenantId}`);
    
    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return res.status(404).json({ message: 'Tenant not found' });
    }

    // Test connection before syncing
    console.log(`Testing connection to Shopify store: ${tenant.shop_domain}`);
    const connectionTest = await testShopifyConnection(tenant.shop_domain, tenant.access_token);
    
    if (!connectionTest.success) {
      console.error('Shopify connection failed:', connectionTest.error);
      return res.status(400).json({ 
        message: 'Failed to connect to Shopify store', 
        error: connectionTest.error 
      });
    }
    
    console.log('Shopify connection successful, starting sync...');
    await syncShopifyData(tenantId);
    
    res.json({ message: 'Force sync completed successfully' });
  } catch (error) {
    console.error('Force sync error:', error);
    res.status(500).json({ message: 'Force sync failed', error: error.message });
  }
});

// Test Shopify connection endpoint
router.post('/test-connection', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({ message: 'Tenant not found' });
    }

    console.log(`Testing connection to Shopify store: ${tenant.shop_domain}`);
    const connectionTest = await testShopifyConnection(tenant.shop_domain, tenant.access_token);
    
    if (connectionTest.success) {
      console.log('Shopify connection successful:', connectionTest.shop.name);
      res.json({ 
        success: true, 
        shop: connectionTest.shop.name,
        domain: tenant.shop_domain
      });
    } else {
      console.error('Shopify connection failed:', connectionTest.error);
      res.status(400).json({ 
        success: false, 
        error: connectionTest.error 
      });
    }
  } catch (error) {
    console.error('Connection test error:', error);
    res.status(500).json({ message: 'Connection test failed' });
  }
});

// Webhook endpoint for Shopify
router.post('/webhook', async (req, res) => {
  try {
    // Shopify webhook processing
    // This would need proper webhook verification in production
    const { topic } = req.headers['x-shopify-topic'] || '';
    const shopDomain = req.headers['x-shopify-shop-domain'];
    
    console.log(`Received webhook: ${topic} from ${shopDomain}`);
    
    // Process webhook data based on topic
    // Topics: orders/create, orders/updated, customers/create, etc.
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

export default router;