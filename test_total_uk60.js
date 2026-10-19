// So their list sums to 27,793.
// Why did my script get 26,098.45?
// Let's print out the amounts per project from my script.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  let from = 0;
  const pageSize = 1000;
  const allProjs = [];
  while (true) {
    const { data } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office').range(from, from + pageSize - 1);
    if (!data) break;
    allProjs.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  const unileverProjs = allProjs.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  const projectSums = {};
  
  from = 0;
  while (true) {
    const { data } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').range(from, from + pageSize - 1);
    if (!data) break;
    
    data.forEach(t => {
      const p = unileverProjs.find(p => t.opportunity_name === p.title || t.opportunity_name.startsWith(p.title + " "));
      if (p && (p.office === 'United Kingdom' || p.office === 'UK' || p.office === 'London' || p.sf_account.includes('UK'))) {
          if (t.month_date >= '2025-05-01' && t.month_date <= '2026-04-01') {
              projectSums[p.title] = (projectSums[p.title] || 0) + Number(t.amount);
          }
      }
    });
    
    if (data.length < pageSize) break;
    from += pageSize;
  }
  
  console.log(projectSums);
}
run();
