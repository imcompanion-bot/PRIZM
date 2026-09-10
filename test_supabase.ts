import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  let allData = [];
  let page = 0;
  while(true) {
    const { data, error } = await supabase.from('projects').select('title, sf_account, ultimate_parent, office, extra_data').range(page*1000, (page+1)*1000-1);
    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;
    allData.push(...data);
    if (data.length < 1000) break;
    page++;
  }
  
  let sumFY = 0, sumQ1 = 0;
  for (const d of allData) {
    if (d.extra_data && d.office && (d.office.toUpperCase().includes('UK') || d.office.toUpperCase().includes('KINGDOM') || d.office.toUpperCase().includes('COMPANION'))) {
      const client = d.ultimate_parent || d.sf_account || "Unknown Client";
      if (client.toLowerCase().includes('heineken')) {
          sumFY += d.extra_data.gp_fy25_26 || 0; 
          sumQ1 += d.extra_data.gp_q1_25_26 || 0;
      }
    }
  }
  console.log('Total projects fetched:', allData.length);
  console.log('Heineken UK FY 25/26 DB Total:', sumFY);
  console.log('Heineken UK Q1 25/26 DB Total:', sumQ1);
}
run();
