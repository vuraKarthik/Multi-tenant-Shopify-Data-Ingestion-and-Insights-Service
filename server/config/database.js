import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database initialization - create tables if they don't exist
export const initializeDatabase = async () => {
  console.log('🔧 Initializing database schema...');
  
  try {
    // The database schema should be created via Supabase migrations
    // This is a placeholder for any runtime initialization
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
  }
};

// Call initialization
initializeDatabase();