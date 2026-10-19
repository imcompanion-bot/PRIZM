import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs, error: projsErr } = await supabase.from('projects').select('opportunity_name, sf_account');
  if (projsErr) console.error(projsErr);
}
run();
