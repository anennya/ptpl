import { supabase } from './lib/supabase';

const fetchBooks = async () => {
  console.log('Fetching books...');
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .limit(10)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('Books:', data);
  return data;
};

fetchBooks();