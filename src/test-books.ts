import { supabase } from './lib/supabase';

const fetchBooks = async () => {
  try {
    process.stdout.write('Connecting to Supabase...\n');
    process.stdout.write(`URL: ${process.env.VITE_SUPABASE_URL ? 'Set' : 'Not set'}\n`);
    
    process.stdout.write('Fetching books...\n');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      process.stdout.write('Supabase Error: ' + error.message + '\n');
      process.stdout.write('Error Details: ' + JSON.stringify(error, null, 2) + '\n');
      return;
    }

    if (!data || data.length === 0) {
      process.stdout.write('No books found in the database\n');
      return;
    }

    process.stdout.write(`Found ${data.length} books:\n`);
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
    
  } catch (err) {
    process.stdout.write('Unexpected error: ' + err + '\n');
  }
};

// Execute and handle promise rejection
fetchBooks().catch(err => {
  process.stdout.write('Fatal error: ' + err + '\n');
  process.exit(1);
});