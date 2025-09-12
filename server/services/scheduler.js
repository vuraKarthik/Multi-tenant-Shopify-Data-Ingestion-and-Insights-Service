import cron from 'node-cron';
import { supabase } from '../config/database.js';
import { syncShopifyData } from './shopify.js';

// Function to run the scheduled sync
const runScheduledSync = async () => {
  console.log('=> Starting scheduled sync for all tenants...');
  
  try {
    // Get all active tenants
    const { data: tenants, error } = await supabase
      .from('tenants')
      .select('id');

    if (error) {
      console.error('Failed to fetch tenants:', error);
      return;
    }
    
    console.log(`Found ${tenants?.length || 0} tenants to sync`);

    // Sync data for each tenant
    for (const tenant of tenants) {
      try {
        await syncShopifyData(tenant.id);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        console.error(`Sync failed for tenant ${tenant.id}:`, error.message);
      }
    }

    console.log('✅ Scheduled sync completed for all tenants');
  } catch (error) {
    console.error('❌ Scheduled sync failed:', error.message);
  }
};

export const startSyncScheduler = () => {
  // Run sync every hour for all tenants
  cron.schedule('0 * * * *', async () => {
    await runScheduledSync();
  });

  // Run immediately on startup
  setTimeout(() => runScheduledSync(), 5000);

  console.log('*** Sync scheduler started - running every hour ***');
};