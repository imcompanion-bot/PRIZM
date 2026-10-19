import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: proj } = await supabase.from('projects').select('*').limit(1);
  console.log(Object.keys(proj[0]));
}
run();
