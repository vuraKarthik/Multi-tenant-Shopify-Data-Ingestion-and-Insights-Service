import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import shopifyRoutes from './routes/shopify.js';
import customersRoutes from './routes/customers.js';
import ordersRoutes from './routes/orders.js';
import productsRoutes from './routes/products.js';
import { startSyncScheduler } from './services/scheduler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
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

// Start sync scheduler
startSyncScheduler();

app.listen(PORT, () => {
  console.log(`_____Server running on port ${PORT}_____`);
  console.log(`Dashboard API: http://localhost:${PORT}/api`);
});