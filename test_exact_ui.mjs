import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
   // Wait, let's just log what the client actually gets.
   const { data: projs } = await supabase.from("projects").select("id, title, revenue, budget_cost, start_date, end_date, ultimate_parent, office, fx_rate_gbp, fx_rate_usd, fee_calc_currency").ilike("title", "%King%");
   
   // ... it's too much logic to duplicate. Let's just calculate King's total prorated revenue.
   let rev = 0;
   let rawCost = 0;
   // let's look at `get_project_costs_monthly`
   const { data: costs } = await supabase.rpc("get_project_costs_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
   
   for (const p of projs) {
      if (p.revenue) {
         const days = (new Date(p.end_date) - new Date(p.start_date)) / 86400000;
         const overlap = 184; // roughly 6 months
         rev += p.revenue * Math.min(1, overlap/days);
      }
   }
   console.log("King Approx Rev:", rev);
}
run();
