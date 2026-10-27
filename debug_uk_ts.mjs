import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
import { endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

async function run() {
  const { data: timesheets } = await supabase.rpc("get_utilisation_summary_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
  
  const personMonthTotal = new Map();
  for (const row of timesheets) {
    if (!personMonthTotal.has(row.person_id)) personMonthTotal.set(row.person_id, new Map());
    const current = personMonthTotal.get(row.person_id).get(row.month_date) || 0;
    personMonthTotal.get(row.person_id).set(row.month_date, current + (row.total_hours || 0));
  }
  
  const { data: ppl } = await supabase.from("people").select("*").in("office", ["UK", "United Kingdom"]).limit(5);
  
  for (const p of ppl) {
     console.log(`Person: ${p.name}`);
     console.log(`  Start: ${p.employment_start_date}`);
     const months = personMonthTotal.get(p.id) || new Map();
     for (const [m, t] of months) {
        console.log(`  Month: ${m}, Total TS Hours: ${t}`);
     }
  }
}
run();
