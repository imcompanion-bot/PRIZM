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
  const { data: projects } = await supabase.from('projects').select('*');
  const projectOfficeMap = new Map();
  projects.forEach(p => {
    if (p.title) {
       const client = p.ultimate_parent || p.sf_account || "Unknown Client";
       const cleanName = p.title.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
       projectOfficeMap.set(cleanName, { office: p.office, client });
    }
  });
  
  const { data: tes } = await supabase.from('talent_efficiencies').select('*');
  
  let unileverSum = 0;
  let unileverRows = [];
  
  tes.forEach(eff => {
    const oppName = eff.opportunity_name || "Unknown Opportunity";
    const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
    
    let effOffice = eff.office;
    let client = "Unknown Client";
    const mapInfo = projectOfficeMap.get(cleanName);
    
    // In widget:
    // if client doesn't match perfectly, it falls back to "Unknown Client".
    // But what if the TE opportunity name ALREADY has the client name?
    // The widget DOES NOT do "if (oppName.includes('Unilever')) client = 'Unilever'".
    // The widget ONLY relies on projectOfficeMap.
    
    if (mapInfo) {
       if (!effOffice || effOffice === "Unknown") effOffice = mapInfo.office;
       client = mapInfo.client;
    }
    
    // BUT what if the user manually added up £28k, and the tool is showing £31k for SOME OTHER REASON?
    // Wait, let's print ALL TE sums by client in the widget to see if Unilever is 31k!
    
    const o = effOffice?.toUpperCase() || "";
    let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    if (!matchesOffice) return;

    const fy = getFYForDate(eff.month_date);
    if (fy === "fy25_26") {
       if (client === "Unilever") {
           unileverSum += Number(eff.amount);
           unileverRows.push(eff);
       }
    }
  });
  
  console.log("Widget Unilever TE sum:", unileverSum);
  
  // Now let's calculate what happens if we ALSO map "Unknown Client" rows that contain "Unilever" in the name to Unilever.
  let manualSum = 0;
  tes.forEach(eff => {
    const oppName = eff.opportunity_name || "Unknown Opportunity";
    const o = eff.office?.toUpperCase() || "";
    let matchesOffice = (o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION");
    const fy = getFYForDate(eff.month_date);
    if (matchesOffice && fy === "fy25_26" && oppName.toLowerCase().includes("unilever")) {
        manualSum += Number(eff.amount);
    }
  });
  console.log("Manual substring Unilever TE sum:", manualSum);
}
run();
