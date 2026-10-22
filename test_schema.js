import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data, error } = await supabase.rpc('get_table_schema', { table_name: 'projects' });
  if (error) {
     // fallback
     const res = await supabase.from('projects').select('*').limit(1);
     console.log(Object.keys(res.data[0]));
  } else {
     console.log(data);
  }
}
run();
