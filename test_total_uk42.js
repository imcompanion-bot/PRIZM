import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projs } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office');
  const unileverProjs = projs.filter(p => p.ultimate_parent === 'Unilever' || (p.sf_account && p.sf_account.includes('Unilever')));
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('amount, month_date, opportunity_name').ilike('opportunity_name', "%Dove UK - Skincare%");
  
  tes?.forEach(t => {
      // Find matching project
      const p = unileverProjs.find(p => t.opportunity_name.includes(p.title) || p.title.includes(t.opportunity_name) || t.opportunity_name === p.title);
      console.log(t.opportunity_name, p?.title, p?.office);
  });
}
run();
