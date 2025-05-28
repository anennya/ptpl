import { supabase } from './lib/supabase';
import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log file with timestamp
const logFile = path.join(logsDir, `supabase-test-${new Date().toISOString().replace(/[:.]/g, '-')}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Custom logger that writes to both console and file
const log = (message: string) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  logStream.write(logMessage);
};

const fetchBooks = async () => {
  try {
    // Check environment variables
    log('Checking environment variables...');
    log(`SUPABASE_URL: ${process.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Not set'}`);
    log(`SUPABASE_ANON_KEY: ${process.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set'}`);
    
    if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
      throw new Error('Required environment variables are missing');
    }

    log('\nConnecting to Supabase...');
    
    log('Fetching books...');
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .limit(10)
      .order('created_at', { ascending: false });

    if (error) {
      log('Supabase Error: ' + error.message);
      log('Error Details: ' + JSON.stringify(error, null, 2));
      return;
    }

    if (!data || data.length === 0) {
      log('No books found in the database');
      return;
    }

    log(`\nFound ${data.length} books:`);
    log(JSON.stringify(data, null, 2));
    
  } catch (err) {
    log('Unexpected error: ' + (err instanceof Error ? err.message : String(err)));
    if (err instanceof Error && err.stack) {
      log('Stack trace: ' + err.stack);
    }
  } finally {
    // Close the log stream
    logStream.end();
  }
};

// Execute and handle promise rejection
fetchBooks().catch(err => {
  log('Fatal error: ' + (err instanceof Error ? err.message : String(err)));
  if (err instanceof Error && err.stack) {
    log('Stack trace: ' + err.stack);
  }
  process.exit(1);
});