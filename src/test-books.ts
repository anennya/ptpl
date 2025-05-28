import { supabase } from './lib/supabase';

const fetchBooks = async () => {
  try {
    console.log('Connecting to Supabase...');
    console.log('URL:', process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
    
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

    console.log('Found', data.length, 'books:');
    console.log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

// Execute and handle promise rejection
fetchBooks().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});