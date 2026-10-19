import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const allData = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data } = await supabase
      .from("projects")
      .select('title, sf_account, ultimate_parent, office')
      .range(from, from + pageSize - 1);
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  const unileverProjs = allData.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  let fromTE = 0;
  const allTEs = [];
  while (true) {
    const { data } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').range(fromTE, fromTE + pageSize - 1);
    allTEs.push(...(data || []));
    if (!data || data.length < pageSize) break;
    fromTE += pageSize;
  }
  
  let sum = 0;
  allTEs.forEach(t => {
      const p = unileverProjs.find(p => t.opportunity_name === p.title || t.opportunity_name.startsWith(p.title + " "));
      
      if (p && (p.office === 'United Kingdom' || p.office === 'UK' || p.office === 'London' || p.sf_account.includes('UK'))) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              let displayAmount = Number(t.amount);
              sum += displayAmount;
          }
      }
  });
  console.log("UK Unilever (office = United Kingdom) 25/26 TEs sum:", sum);
}
run();
