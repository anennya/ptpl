import { supabase } from './lib/supabase';

const fetchBooks = async () => {
  try {
    console.log('Starting book fetch...');
    
    // Log environment variables status
    console.log('Environment variables check:');
    console.log(`SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? 'Present' : 'Missing'}`);
    console.log(`SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`);

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching books:', error.message);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No books found in the database');
      return;
    }

    console.log('\nFetched books:');
    console.table(data);
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
};

fetchBooks();