import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { count } = await supabase.from('people').select('*', { count: 'exact', head: true });
  console.log("Total people count:", count);
}
run();
