import axios from 'axios';
import { supabase } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

// Test Shopify connection
export const testShopifyConnection = async (shopDomain, accessToken) => {
  try {
    const response = await axios.get(`https://${shopDomain}/admin/api/2023-10/shop.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken
      }
    });
    
    return { success: true, shop: response.data.shop };
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.errors || error.message 
    };
  }
};

// Sync all Shopify data for a tenant
export const syncShopifyData = async (tenantId) => {
  try {
    console.log(`🔄 Starting sync for tenant: ${tenantId}`);
    
    // Get tenant info
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Sync customers
    await syncCustomers(tenant);
    
    // Sync products
    await syncProducts(tenant);
    
    // Sync orders
    await syncOrders(tenant);

    console.log(`✅ Sync completed for tenant: ${tenantId}`);
  } catch (error) {
    console.error(`❌ Sync failed for tenant ${tenantId}:`, error.message);
    throw error;
  }
};

// Sync customers from Shopify
const syncCustomers = async (tenant) => {
  try {
    const response = await axios.get(`https://${tenant.shop_domain}/admin/api/2023-10/customers.json`, {
      headers: {
        'X-Shopify-Access-Token': tenant.access_token
      }
    });

    const customers = response.data.customers;
    
    for (const customer of customers) {
      const customerData = {
        id: uuidv4(),
        tenant_id: tenant.id,
        shopify_id: customer.id.toString(),
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        email: customer.email || '',
        total_spent: parseFloat(customer.total_spent) || 0,
        orders_count: customer.orders_count || 0,
        created_at: customer.created_at,
        updated_at: new Date().toISOString()
      };

      // Upsert customer
      const { error } = await supabase
        .from('customers')
        .upsert([customerData], { 
          onConflict: 'tenant_id,shopify_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Customer sync error:', error);
      }
    }
    
    console.log(`✅ Synced ${customers.length} customers`);
  } catch (error) {
    console.error('Customer sync failed:', error.message);
  }
};

// Sync products from Shopify
const syncProducts = async (tenant) => {
  try {
    const response = await axios.get(`https://${tenant.shop_domain}/admin/api/2023-10/products.json`, {
      headers: {
        'X-Shopify-Access-Token': tenant.access_token
      }
    });

    const products = response.data.products;
    
    for (const product of products) {
      // Get first variant for pricing info
      const variant = product.variants[0];
      
      const productData = {
        id: uuidv4(),
        tenant_id: tenant.id,
        shopify_id: product.id.toString(),
        title: product.title,
        vendor: product.vendor || '',
        product_type: product.product_type || '',
        price: parseFloat(variant?.price) || 0,
        inventory_quantity: variant?.inventory_quantity || 0,
        created_at: product.created_at,
        updated_at: new Date().toISOString()
      };

      // Upsert product
      const { error } = await supabase
        .from('products')
        .upsert([productData], { 
          onConflict: 'tenant_id,shopify_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Product sync error:', error);
      }
    }
    
    console.log(`✅ Synced ${products.length} products`);
  } catch (error) {
    console.error('Product sync failed:', error.message);
  }
};

// Sync orders from Shopify
const syncOrders = async (tenant) => {
  try {
    const response = await axios.get(`https://${tenant.shop_domain}/admin/api/2023-10/orders.json`, {
      headers: {
        'X-Shopify-Access-Token': tenant.access_token
      }
    });

    const orders = response.data.orders;
    
    for (const order of orders) {
      const orderData = {
        id: uuidv4(),
        tenant_id: tenant.id,
        shopify_id: order.id.toString(),
        customer_id: order.customer ? order.customer.id.toString() : null,
        total_price: parseFloat(order.total_price) || 0,
        currency: order.currency || 'USD',
        order_status: order.financial_status || 'pending',
        created_at: order.created_at,
        updated_at: new Date().toISOString()
      };

      // Upsert order
      const { error } = await supabase
        .from('orders')
        .upsert([orderData], { 
          onConflict: 'tenant_id,shopify_id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error('Order sync error:', error);
      }
    }
    
    console.log(`✅ Synced ${orders.length} orders`);
  } catch (error) {
    console.error('Order sync failed:', error.message);
  }
};