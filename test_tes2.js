import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data: projects } = await supabase.from('projects').select('office, ultimate_parent, sf_account, title');
  const projectOfficeMap = new Map();
  projects.forEach(p => {
    if (p.title) {
       const client = p.ultimate_parent || p.sf_account || "Unknown";
       const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
       projectOfficeMap.set(cleanName, { office: p.office, client });
    }
  });
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('*');
  let unileverTEs = [];
  
  tes.forEach(eff => {
    const oppName = eff.opportunity_name || "Unknown Opportunity";
    const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
    
    const mapInfo = projectOfficeMap.get(cleanName);
    let effOffice = eff.office;
    let client = "Unknown Client";
    if (mapInfo) {
       if (!effOffice || effOffice === "Unknown") effOffice = mapInfo.office;
       client = mapInfo.client;
    }
    
    if (client === "Unilever" || oppName.toLowerCase().includes("unilever")) {
       unileverTEs.push({ ...eff, client, mappedOffice: effOffice });
    }
  });
  
  console.log(`Found ${unileverTEs.length} Unilever TEs`);
  unileverTEs.forEach(t => console.log(`${t.month_date} | ${t.mappedOffice} | ${t.client} | ${t.opportunity_name} | ${t.amount}`));
}
run();
