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
      .from("projects")
      .select('title, sf_account, ultimate_parent, office')
      .range(from, from + pageSize - 1);
    allData.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  const unileverProjs = allData.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Skincare%");
  
  tes?.forEach(t => {
      const p = unileverProjs.find(p => t.opportunity_name === p.title || t.opportunity_name.startsWith(p.title + " "));
      console.log(t.opportunity_name, p?.title);
  });
}
run();
