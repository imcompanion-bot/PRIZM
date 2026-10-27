import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
import { parseISO, eachDayOfInterval, isWeekend, endOfMonth } from "date-fns";

async function run() {
  const { data: projs } = await supabase.from("projects").select("id, title, revenue").ilike("title", "%King%");
  const kingIds = new Set(projs.map(p => p.id));
  
  const { data: timesheets } = await supabase.rpc("get_utilisation_summary_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
  
  const personMonthTotal = new Map();
  for (const row of timesheets) {
    if (!personMonthTotal.has(row.person_id)) personMonthTotal.set(row.person_id, new Map());
    const current = personMonthTotal.get(row.person_id).get(row.month_date) || 0;
    personMonthTotal.get(row.person_id).set(row.month_date, current + (row.total_hours || 0));
  }
  
  const { data: ppl } = await supabase.from("people").select("*");
  const { data: pt } = await supabase.from("part_time_configs").select("*");
  const getExpectedHours = (personId, monthKey) => {
      const person = ppl.find(p => p.id === personId);
      if (!person) return 0;
      const monthStart = new Date(monthKey);
      const monthEnd = endOfMonth(monthStart);
      const empStart = person.employment_start_date ? new Date(person.employment_start_date) : null;
      if (empStart && empStart > monthEnd) return 0;
      return 160; // Simplified for speed
  };
  
  const personMonthComp = new Map();
  for (const [personId, months] of personMonthTotal) {
    if (!personMonthComp.has(personId)) personMonthComp.set(personId, new Map());
    for (const [monthKey, total] of months) {
      personMonthComp.get(personId).set(monthKey, Math.min((total / 160) * 100, 100));
    }
  }
  
  let kingActualCost = 262132; 
  let kingRev = 2571222;
  
  // calculate completenessData.projectComp
  const projectCompRaw = new Map();
  for (const row of timesheets) {
     if (row.project_id && row.total_hours > 0 && kingIds.has(row.project_id)) {
        if (!projectCompRaw.has(row.project_id)) projectCompRaw.set(row.project_id, { expected: 0, actual: 0 });
        const c = personMonthComp.get(row.person_id)?.get(row.month_date);
        if (c !== undefined) {
           projectCompRaw.get(row.project_id).expected += 100;
           projectCompRaw.get(row.project_id).actual += c;
        }
     }
  }
  
  let sumCost = 0;
  for (const [projId, raw] of projectCompRaw) {
      const comp = raw.expected > 0 ? (raw.actual / raw.expected) * 100 : 100;
      const factor = 100 / comp;
      console.log(`Proj ${projId}: Comp ${comp.toFixed(1)}%, Factor ${factor.toFixed(2)}`);
  }
}
run();
