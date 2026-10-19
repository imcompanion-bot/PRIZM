import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs, error: projsErr } = await supabase.from('projects').select('title, sf_account, ultimate_parent').limit(5);
  console.log(projs);
}
run();
