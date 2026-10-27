import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: ppl } = await supabase.from("people").select("id, name").ilike("name", "%Natasha Trewin%");
  const personId = ppl[0].id;
  
  const { data: ts, error } = await supabase.from("time_entries")
    .select("*")
    .eq("person_id", personId)
    .gte("date", "2026-03-01")
    .lte("date", "2026-08-31");
    
  if (error) { console.error(error); return; }
  
  let unassignedHours = 0;
  let unassignedTs = [];
  
  for (const t of ts) {
     if (!t.project_id) {
        unassignedHours += t.hours;
        unassignedTs.push(t);
     }
  }
  
  console.log(`Total unassigned (project_id null) hours: ${unassignedHours}`);
  if (unassignedTs.length > 0) {
     console.log("Sample unassigned TS:");
     console.log(unassignedTs.slice(0, 5));
  }
}
run();
