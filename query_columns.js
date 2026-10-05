import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('time_entries').select('*').limit(1);
  if (error) console.error(error);
  else {
    console.log("COLUMNS:", Object.keys(data[0] || {}));
  }
}
run();
