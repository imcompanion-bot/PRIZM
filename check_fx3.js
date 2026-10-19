import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const allData = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase
      .from('projects')
      .select('fx_rate_gbp, fx_rate_usd')
      .not('fx_rate_gbp', 'is', null)
      .range(from, from + pageSize - 1);
    if (error) throw error;
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  let ratios = [];
  allData.forEach(p => {
    if (p.fx_rate_gbp && p.fx_rate_usd && p.fx_rate_gbp > 0) {
      ratios.push(p.fx_rate_usd / p.fx_rate_gbp);
    }
  });
  ratios.sort((a,b) => a-b);
  console.log("Ratios count:", ratios.length);
  const rate = ratios.length > 0 ? ratios[Math.floor(ratios.length / 2)] : 1.27;
  console.log("Calculated Median Rate:", rate);
}
run();
