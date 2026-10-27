import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");

async function run() {
  const PAGE_SIZE = 1000;
  let allData = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase.rpc("get_utilisation_summary_monthly", {
      _start_date: "2026-03-01",
      _end_date: "2026-08-31"
    })
      .order("month_date")
      .order("person_id")
      .order("project_id")
      .range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    allData = allData.concat(data || []);
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  
  console.log("Total utilisation rows fetched:", allData.length);
  
  // check total hours for Lisa Reimeir
  const { data: ppl } = await supabase.from("people").select("id, name").ilike("name", "%Lisa Reimeir%");
  if (ppl.length > 0) {
     const lisaId = ppl[0].id;
     let sum = 0;
     for (const r of allData) if (r.person_id === lisaId) sum += r.total_hours;
     console.log("Lisa TS hours in allData:", sum);
  }
}
run();
