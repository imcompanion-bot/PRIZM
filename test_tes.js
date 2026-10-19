import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

function getFYForDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  if (m >= 5) {
    return `fy${y.toString().slice(-2)}_${(y + 1).toString().slice(-2)}`;
  } else {
    return `fy${(y - 1).toString().slice(-2)}_${y.toString().slice(-2)}`;
  }
}

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
  let unileverTotal = 0;
  
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
    
    const o = effOffice?.toUpperCase() || "";
    let isUK = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    const fy = getFYForDate(eff.month_date);
    
    if (isUK && client === "Unilever" && fy === "fy25_26") {
       unileverTEs.push(eff);
       unileverTotal += Number(eff.amount) || 0;
    }
  });
  
  console.log("Unilever UK FY25/26 TEs:");
  unileverTEs.forEach(t => console.log(`${t.month_date} | ${t.opportunity_name} | Amount: ${t.amount}`));
  console.log("Total:", unileverTotal);
}
run();
