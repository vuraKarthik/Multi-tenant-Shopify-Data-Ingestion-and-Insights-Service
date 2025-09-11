export interface Tenant {
  id: string;
  shop_domain: string;
  access_token: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  tenant_id: string;
  shopify_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_spent: number;
  orders_count: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  tenant_id: string;
  shopify_id: string;
  customer_id?: string;
  total_price: number;
  currency: string;
  order_status: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  shopify_id: string;
  title: string;
  vendor: string;
  product_type: string;
  price: number;
  inventory_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  tenant_id: string;
}

export interface DashboardMetrics {
  totalCustomers: number;
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
}

export interface OrdersByDate {
  date: string;
  count: number;
  revenue: number;
}

export interface TopCustomer {
  id: string;
  name: string;
  email: string;
  totalSpent: number;
  ordersCount: number;
}