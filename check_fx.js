import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('fx_rate_gbp, fx_rate_usd').not('fx_rate_gbp', 'is', null);
  let ratios = [];
  data.forEach(p => {
    if (p.fx_rate_gbp && p.fx_rate_usd && p.fx_rate_gbp > 0) {
      ratios.push(p.fx_rate_usd / p.fx_rate_gbp);
    }
  });
  ratios.sort((a,b) => a-b);
  console.log("Median FX rate is:", ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)] : 1.27);
  console.log("Unique ratios found:", [...new Set(ratios)]);
}
run();
