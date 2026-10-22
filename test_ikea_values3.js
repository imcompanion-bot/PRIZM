import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('*').ilike('title', '%IKEA - NYTILLVERKAD - Part 2 & Talent%');
  const p = data[0];
  console.log("RTB Start:", p.extra_data?.rtb_start_date);
  console.log("RTB End:", p.extra_data?.rtb_end_date);
  console.log("Link:", p.last_fee_calc_url);
}
run();
