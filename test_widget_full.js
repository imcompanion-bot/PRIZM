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
       const client = p.ultimate_parent || p.sf_account || "Unknown Client";
       const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
       projectOfficeMap.set(cleanName, { office: p.office, client });
    }
  });
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('*');
  let clientData = {};
  
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
    
    if (!clientData[client]) clientData[client] = { teActive: 0, tePrior: 0 };
    
    const o = effOffice?.toUpperCase() || "";
    let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    if (!matchesOffice) return;

    const fy = getFYForDate(eff.month_date);
    if (!fy) return;

    let displayAmount = Number(eff.amount) || 0;
    
    if (fy === "fy25_26") clientData[client].teActive += displayAmount;
    if (fy === "fy24_25") clientData[client].tePrior += displayAmount;
  });
  
  console.log("UK TEs for 25_26:");
  const compiled = Object.entries(clientData).map(([c, data]) => ({ client: c, te: data.teActive })).filter(x => x.te > 0);
  compiled.sort((a,b) => b.te - a.te);
  console.log(compiled);
}
run();
