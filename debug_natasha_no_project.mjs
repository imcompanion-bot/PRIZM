import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: ppl } = await supabase.from("people").select("id, name").ilike("name", "%Natasha Trewin%");
  const personId = ppl[0].id;
  
  const { data: ts } = await supabase.from("time_entries")
    .select("*")
    .eq("person_id", personId)
    .gte("date", "2026-03-01")
    .lte("date", "2026-08-31");
    
  let map = new Map();
  for (const t of ts) {
     if (!t.project_id) { // wait, what does the UI use to group?
         // In Utilisation tab, how are non-billable projects grouped? Let me check the code.
     }
  }
}
run();
