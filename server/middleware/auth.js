import jwt from 'jsonwebtoken';
import { supabase } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-jwt-secret-key';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user exists in database
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', decoded.tenantId)
      .single();

    if (error || !tenant) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tenantId: decoded.tenantId
    };

    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};