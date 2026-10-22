import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('*').ilike('title', '%IKEA - NYTILLVERKAD - Part 2 & Talent%');
  const p = data[0];
  console.log("Revenue GBP:", p.revenue);
  console.log("Revenue EUR:", p.extra_data.project_currency_revenue);
  console.log("Budget Cost GBP:", p.budget_cost);
  console.log("Creator Cost GBP:", p.contracted_infl_cost);
  console.log("Media Cost GBP:", p.media_cost);
  console.log("GP Full Value GBP:", p.gp_full_value);
  console.log("Link:", p.last_fee_calc_url);
}
run();
