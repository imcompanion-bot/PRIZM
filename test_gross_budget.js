import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('*').ilike('title', '%IKEA - NYTILLVERKAD - Part 2 & Talent%');
  const p = data[0];
  console.log("gross_budget:", p.gross_budget);
  console.log("extra_data.project_currency_gross_budget:", p.extra_data?.project_currency_gross_budget);
  console.log("extra_data.project_currency:", p.extra_data?.project_currency);
  console.log("budget_cost (Net Budget GBP):", p.budget_cost);
}
run();
