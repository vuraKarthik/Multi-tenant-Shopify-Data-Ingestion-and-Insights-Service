import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { syncShopifyData } from '../services/shopify.js';

const router = express.Router();

// Trigger manual sync
router.post('/sync', authenticateToken, async (req, res) => {
  try {
    const { tenantId } = req.user;
    
    await syncShopifyData(tenantId);
    
    res.json({ message: 'Sync completed successfully' });
  } catch (error) {
    console.error('Manual sync error:', error);
    res.status(500).json({ message: 'Sync failed' });
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