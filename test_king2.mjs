import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: timesheets } = await supabase.from("time_entries").select("project_id, hours, date").gte("date", "2026-03-01").lte("date", "2026-08-31");
  const projectIds = Array.from(new Set(timesheets.map(t => t.project_id).filter(id => id)));
  
  let projs = [];
  for (let i = 0; i < projectIds.length; i += 1000) {
    const chunk = projectIds.slice(i, i + 1000);
    const { data: chunkProjs } = await supabase.from("projects").select("id, title, revenue, budget_cost, extra_data").in("id", chunk).ilike("title", "%King%");
    projs = projs.concat(chunkProjs || []);
  }
  
  let rev = 0;
  for (const p of projs) rev += p.revenue || 0;
  console.log("King revenue mapped to timesheets:", rev);
  console.log("King Projects mapped:", projs.map(p => p.title));
}
run();
