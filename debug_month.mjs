import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const { data: timesheets } = await supabase.from("time_entries").select("project_id, hours, date").gte("date", "2026-03-01").lte("date", "2026-08-31");
  console.log("Total time entries:", timesheets.length);
  
  let usTotal = 0, ukTotal = 0;
  
  const { data: ppl } = await supabase.from("people").select("id, name, office, uk_percentage, us_percentage");
  
  // wait, time_entries maps to people by person_id.
  const { data: ts } = await supabase.from("time_entries").select("person_id, hours").gte("date", "2026-03-01").lte("date", "2026-08-31");
  
  let mapped = 0;
  for (const t of ts) {
     const p = ppl.find(x => x.id === t.person_id);
     if (p) {
        mapped++;
        if (p.office === 'United States' || p.office === 'US') usTotal += t.hours;
        if (p.office === 'UK' || p.office === 'United Kingdom') ukTotal += t.hours;
     }
  }
  
  console.log(`Mapped TS: ${mapped}/${ts.length}`);
  console.log(`US Hours: ${usTotal}, UK Hours: ${ukTotal}`);
}
run();
