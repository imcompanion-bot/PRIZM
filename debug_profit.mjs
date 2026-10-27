import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: costs } = await supabase.from("monthly_project_costs").select("month_date, cost_usd_staff").gte("month_date", "2026-03-01").lte("month_date", "2026-08-31");
  const { data: tes } = await supabase.from("talent_efficiencies").select("month_date, amount, office").in("office", ["US", "United States"]).gte("month_date", "2026-03-01").lte("month_date", "2026-08-31");
  
  let costByMonth = {};
  for (const c of costs || []) costByMonth[c.month_date] = (costByMonth[c.month_date] || 0) + (c.cost_usd_staff || 0);
  
  let teByMonth = {};
  for (const t of tes || []) teByMonth[t.month_date] = (teByMonth[t.month_date] || 0) + (t.amount || 0);

  console.log("Costs:", costByMonth);
  console.log("TEs:", teByMonth);
}
run();
