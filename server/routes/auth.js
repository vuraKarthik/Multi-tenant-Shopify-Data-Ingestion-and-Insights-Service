import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { testShopifyConnection } from '../services/shopify.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

// Register new tenant
router.post('/register', async (req, res) => {
  try {
    const { email, password, shopDomain, accessToken } = req.body;

    // Validate required fields
    if (!email || !password || !shopDomain || !accessToken) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Test Shopify connection
    const connectionTest = await testShopifyConnection(shopDomain, accessToken);
    if (!connectionTest.success) {
      return res.status(400).json({ message: 'Failed to connect to Shopify store: ' + connectionTest.error });
    }

    // Check if tenant already exists
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('email')
      .eq('email', email)
      .single();

    if (existingTenant) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create tenant
    const tenantId = uuidv4();
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert([{
        id: tenantId,
        email,
        password_hash: hashedPassword,
        shop_domain: shopDomain,
        access_token: accessToken,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (tenantError) {
      console.error('Tenant creation error:', tenantError);
      return res.status(500).json({ message: 'Failed to create account' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: tenantId, email, tenantId },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: tenantId, email, tenantId }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find tenant by email
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !tenant) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, tenant.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: tenant.id, email: tenant.email, tenantId: tenant.id },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: { id: tenant.id, email: tenant.email, tenantId: tenant.id }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;