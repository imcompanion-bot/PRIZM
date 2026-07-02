import { createClient } from "@supabase/supabase-js";
const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const { data: costs } = await supabase.from("costs").select("project_id, user_type, cost_gbp").limit(100000);
  console.log("Fetched", costs?.length, "costs");
  
  const costMap = new Map();
  for (const c of costs || []) {
    if (!costMap.has(c.project_id)) costMap.set(c.project_id, 0);
    costMap.set(c.project_id, costMap.get(c.project_id) + (c.cost_gbp || 0));
  }
  
  const { data: projects } = await supabase.from("projects").select("id, title, project_scopes(scoped_hours)").limit(500);
  
  let grossedUpCount = 0;
  for (const p of projects || []) {
    const totalStaffCost = costMap.get(p.id) || 0;
    const budgetStaffHours = (p.project_scopes || []).reduce((s, sc) => s + (sc.scoped_hours || 0), 0);
    const AVG_HOURLY_COST = 60; // from ProfitabilityPage
    const budgetStaffCost = budgetStaffHours * AVG_HOURLY_COST;
    
    const factor = totalStaffCost > 0 && budgetStaffCost > 0 
      ? budgetStaffCost / totalStaffCost
      : 1;
      
    if (factor > 1) {
      grossedUpCount++;
    }
  }
  
  console.log("Projects grossed up:", grossedUpCount, "out of", projects.length);
}
run();
