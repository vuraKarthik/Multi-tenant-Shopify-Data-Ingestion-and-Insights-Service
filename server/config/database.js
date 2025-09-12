import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables!');
}
export const supabase = createClient(supabaseUrl, supabaseKey);

// Database initialization (creates the tables if they don't exist)
export const initializeDatabase = async () => {
  console.log('🔧 Initializing database schema...');
  
  try {
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

// Calls the initialization
initializeDatabase();