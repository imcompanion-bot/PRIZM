import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: projs } = await supabase.from("projects").select("id, title, revenue, budget_cost, start_date, end_date, rate_cards(name)").ilike("title", "%King%");
  const kingIds = new Set(projs.map(p => p.id));
  
  const { data: costs } = await supabase.rpc("get_project_costs_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
  let costGbp = 0;
  for (const c of costs) {
     if (kingIds.has(c.project_id)) costGbp += c.cost_gbp_staff;
  }
  
  console.log("Total King Cost GBP Mar-Aug:", costGbp);
}
run();
