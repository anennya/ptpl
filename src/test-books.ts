import { supabase } from './lib/supabase';

const fetchBooks = async () => {
  try {
    // Check environment variables
    console.log('Checking environment variables...');
    console.log('SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Not set');
    console.log('SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Required environment variables are missing');
    }

    console.log('\nConnecting to Supabase...');
    
    console.log('Fetching books...');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error.message);
      console.error('Error Details:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No books found in the database');
      return;
    }

    console.log(`\nFound ${data.length} books:`);
    console.table(data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

// Execute and handle promise rejection
fetchBooks().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});