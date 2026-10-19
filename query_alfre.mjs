import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: people, error } = await supabase.from('people').select('*').ilike('name', '%Alfre%');
  if (error) console.error("Error:", error);
  else console.log("People:", people);
}
run();
