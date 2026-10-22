import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('id, title, revenue, budget_cost, media_cost, gp_full_value, extra_data').limit(5);
  for (const p of data) {
    console.log(p.title);
    console.log("GBP Price:", p.revenue);
    console.log("GBP Gross Budget:", p.extra_data?.gross_budget_full_value);
    console.log("GBP Net Budget:", p.budget_cost);
    console.log("GBP Media:", p.media_cost);
    console.log("Project Curr Gross:", p.extra_data?.project_currency_gross_budget);
    console.log("Project Curr Media:", p.extra_data?.project_currency_media_cost);
    console.log("---");
  }
}
run();
