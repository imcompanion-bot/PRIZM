import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('*').ilike('title', '%IKEA - NYTILLVERKAD - Part 2 & Talent%');
  const p = data[0];
  console.log("Revenue (Price GBP):", p.revenue);
  console.log("GP Full Value GBP:", p.gp_full_value);
  console.log("Calculated Margin:", p.gp_full_value / p.revenue);
}
run();
