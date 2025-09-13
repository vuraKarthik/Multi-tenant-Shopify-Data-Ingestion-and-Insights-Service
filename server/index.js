import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import shopifyRoutes from './routes/shopify.js';
import customersRoutes from './routes/customers.js';
import ordersRoutes from './routes/orders.js';
import productsRoutes from './routes/products.js';
import { startSyncScheduler } from './services/scheduler.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://multi-tenant-shopify.vercel.app']
    : ['http://localhost:5173']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/shopify', shopifyRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/products', productsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from the frontend build
  const staticPath = path.resolve(__dirname, '../dist');
  app.use(express.static(staticPath));
  
  // Handle SPA routing - return index.html for all non-API routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
}

// Start sync scheduler
startSyncScheduler();

app.listen(PORT, () => {
  console.log(`_____Server running on port ${PORT}_____`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`API: ${process.env.NODE_ENV === 'production' ? '' : 'http://localhost:' + PORT}/api`);
});