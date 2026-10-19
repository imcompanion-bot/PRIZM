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
  const projects = [];
  let from = 0;
  const pageSize = 1000;
  while (true) {
    const { data, error } = await supabase.from('projects').select('*').range(from, from + pageSize - 1);
    if (error) throw error;
    projects.push(...(data || []));
    if (!data || data.length < pageSize) break;
    from += pageSize;
  }
  
  const tes = [];
  let tFrom = 0;
  while (true) {
    const { data, error } = await supabase.from('talent_efficiencies').select('*').range(tFrom, tFrom + pageSize - 1);
    if (error) throw error;
    tes.push(...(data || []));
    if (!data || data.length < pageSize) break;
    tFrom += pageSize;
  }
  
  const projectOfficeMap = new Map();
  projects.forEach(p => {
    if (p.title) {
       const client = p.ultimate_parent || p.sf_account || "Unknown Client";
       const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
       projectOfficeMap.set(cleanName, { office: p.office, client });
    }
  });
  
  const activeFy = "fy25_26";
  const effectiveCurrency = "GBP";

  let clientData = {};

  projects.forEach(p => {
      const client = p.ultimate_parent || p.sf_account || "Unknown Client";
      if (!clientData[client]) clientData[client] = { gpActive: 0, teActive: 0 };
      const o = p.office?.toUpperCase() || "";
      let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
      if (!matchesOffice) return;

      const ext = p.extra_data || {};
      const val = Number(ext[`gp_${activeFy}`]) || 0;
      clientData[client].gpActive += val;
  });

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
    
    if (!clientData[client]) clientData[client] = { gpActive: 0, teActive: 0 };
    
    const o = effOffice?.toUpperCase() || "";
    let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    if (!matchesOffice) return;

    const fy = getFYForDate(eff.month_date);
    if (fy !== activeFy) return;

    let displayAmount = Number(eff.amount) || 0;
    clientData[client].teActive += displayAmount;
  });
  
  const compiled = Object.entries(clientData).map(([client, data]) => {
      return { client, gp: data.gpActive, te: data.teActive, af: data.gpActive - data.teActive };
  }).filter(x => x.gp > 0 || x.te > 0);
  
  console.log("UK Metrics for 25_26 (Paginated):");
  compiled.sort((a,b) => b.te - a.te).forEach(c => {
     if (c.client === "Unilever" || c.te > 0) {
         console.log(`${c.client} -> GP: ${c.gp} | TE: ${c.te} | AF: ${c.af}`);
     }
  });
}
run();
