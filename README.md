# Shopify Insights Service

A comprehensive multi-tenant Shopify data ingestion and analytics platform built for Forward Deployed Engineer candidates.

## Features

### Core Functionality
- **Multi-tenant Architecture**: Complete data isolation between Shopify stores
- **Real-time Data Sync**: Automated hourly synchronization with Shopify APIs
- **Authentication System**: JWT-based secure authentication with tenant onboarding
- **Analytics Dashboard**: Interactive metrics, charts, and KPI tracking
- **Webhook Support**: Real-time updates via Shopify webhooks

### Dashboard Analytics
- Total customers, orders, and revenue metrics
- Orders and revenue trends over time with date filtering
- Top 5 customers by total spend
- Interactive charts using Recharts
- Responsive design for all devices

### Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + JWT Authentication
- **Database**: Supabase (PostgreSQL) with proper indexing
- **Shopify Integration**: REST API v2023-10
- **Deployment**: Ready for production deployment

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │    │   Express API   │    │  PostgreSQL DB  │
│                 │    │                 │    │                 │
│ - Dashboard     │◄──►│ - Auth Routes   │◄──►│ - Multi-tenant  │
│ - Auth Forms    │    │ - Data APIs     │    │                 │
│ - Charts        │    │ - Shopify Sync  │    │ - Optimized     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              ▲
                              │
                       ┌─────────────────┐
                       │   Shopify API   │
                       │                 │
                       │ - Customers     │
                       │ - Orders        │
                       │ - Products      │
                       │ - Webhooks      │
                       └─────────────────┘
```

## Database Schema

### Tables
- **tenants**: Store Shopify credentials and shop information
- **customers**: Customer data with spend metrics
- **orders**: Order data with pricing and status
- **products**: Product catalog with pricing and inventory

### Multi-tenancy
- All data tables include `tenant_id` for isolation
- Optimized indexes for analytics queries

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Shopify development store

### 1. Clone and Install
```bash
git clone <repository-url>
cd shopify-insights-service
npm install
```

### 2. Database Setup
1. Create a new Supabase project
2. Run the migration: `supabase/migrations/create_schema.sql`
3. Get your project URL and anon key

### 3. Environment Configuration
```bash
cp .env.example .env
```

### 4. Shopify Development Store
1. Create a Shopify Partner account
2. Create a development store
3. Install a private app with these permissions:
   - `read_customers`
   - `read_orders`
   - `read_products`
4. Get your access token

### 5. Start Development
```bash
npm run dev
```

The application runs on:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 🔐 Authentication Flow

1. **Registration**: Users provide email, password, Shopify domain, and access token
2. **Validation**: System tests Shopify connection before account creation
3. **JWT Token**: Secure token generation with tenant identification
4. **Data Sync**: Automatic initial sync after successful registration

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Create new tenant account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/verify` - Verify JWT token

### Dashboard
- `GET /api/dashboard/metrics` - Get overview metrics
- `GET /api/dashboard/orders-by-date` - Orders over time (with date filtering)
- `GET /api/dashboard/top-customers` - Top 5 customers by spend

### Shopify
- `POST /api/shopify/sync` - Manual data synchronization
- `POST /api/shopify/webhook` - Webhook endpoint for real-time updates

## 🔄 Data Synchronization

### Scheduled Sync
- Runs automatically every hour
- Syncs all tenants sequentially
- Rate-limited to respect Shopify API limits

### Manual Sync
- Available via dashboard
- Triggered through `/api/shopify/sync`
- Real-time progress feedback

### Webhook Integration
- Real-time updates for orders, customers, products

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based auth
- **Password Hashing**: bcrypt with salt rounds
- **API Validation**: Input validation and sanitization


## 📈 Performance Optimizations

- Efficient date-range filtering
- Optimized SQL queries for analytics
- Frontend caching strategies

## 📄 License

This project is licensed under the MIT License.
