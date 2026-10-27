import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
import { parseISO, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

async function run() {
  const { data: timesheets } = await supabase.rpc("get_utilisation_summary_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
  
  const { data: projs } = await supabase.from("projects").select("id, title").ilike("title", "%King%");
  const kingIds = new Set(projs.map(p => p.id));
  
  const personMonthComp = new Map();
  const personMonthTotal = new Map();
  
  for (const row of timesheets) {
    if (!personMonthTotal.has(row.person_id)) personMonthTotal.set(row.person_id, new Map());
    const current = personMonthTotal.get(row.person_id).get(row.month_date) || 0;
    personMonthTotal.get(row.person_id).set(row.month_date, current + (row.total_hours || 0));
  }
  
  const { data: ppl } = await supabase.from("people").select("*");
  const { data: pt } = await supabase.from("part_time_configs").select("*");
  const ptConfigs = pt || [];
  
  const getExpectedHours = (personId, monthKey) => {
      const person = ppl.find(p => p.id === personId);
      if (!person) return 0;
      const monthStart = new Date(monthKey);
      const monthEnd = endOfMonth(monthStart);
      const empStart = person.employment_start_date ? new Date(person.employment_start_date) : null;
      const empEnd = person.employment_end_date ? new Date(person.employment_end_date) : null;
      if (empStart && empStart > monthEnd) return 0;
      if (empEnd && empEnd < monthStart) return 0;
      const effectiveStart = empStart && empStart > monthStart ? empStart : monthStart;
      const effectiveEnd = empEnd && empEnd < monthEnd ? empEnd : monthEnd;
      if (effectiveStart > effectiveEnd) return 0;
      let workingDays = 0;
      const ptC = ptConfigs.filter(c => c.person_id === person.id).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      const days = eachDayOfInterval({ start: effectiveStart, end: effectiveEnd });
      for (const d of days) {
        if (isWeekend(d)) continue;
        let daysPerWeek = 5;
        const active = ptC.find(c => {
          const start = c.start_date ? new Date(c.start_date) : null;
          const end = c.end_date ? new Date(c.end_date) : null;
          return (!start || d >= start) && (!end || d <= end);
        });
        if (active && active.days_per_week) daysPerWeek = active.days_per_week;
        workingDays += (daysPerWeek / 5.0);
      }
      return workingDays * 8;
  };
  
  for (const [personId, months] of personMonthTotal) {
    if (!personMonthComp.has(personId)) personMonthComp.set(personId, new Map());
    for (const [monthKey, total] of months) {
      const expected = getExpectedHours(personId, monthKey);
      if (expected > 0) {
        personMonthComp.get(personId).set(monthKey, Math.min((total / expected) * 100, 100));
      }
    }
  }
  
  const projMonthComps = new Map();
  for (const row of timesheets) {
    if (row.project_id && row.total_hours > 0 && kingIds.has(row.project_id)) {
       const comp = personMonthComp.get(row.person_id)?.get(row.month_date);
       if (comp !== undefined) {
         if (!projMonthComps.has(row.project_id)) projMonthComps.set(row.project_id, new Map());
         if (!projMonthComps.get(row.project_id).has(row.month_date)) projMonthComps.get(row.project_id).set(row.month_date, {sum:0, count:0});
         const mData = projMonthComps.get(row.project_id).get(row.month_date);
         mData.sum += comp;
         mData.count++;
       }
    }
  }
  
  for (const [projId, months] of projMonthComps) {
     const p = projs.find(x => x.id === projId);
     console.log("Project:", p.title);
     for (const [monthKey, data] of months) {
        if (data.count > 0) {
           const comp = data.sum / data.count;
           let factor = 1;
           if (comp > 0 && comp < 99.5) factor = Math.min(100/comp, 3);
           console.log(`  ${monthKey}: Avg Comp ${comp.toFixed(1)}%, Factor: ${factor.toFixed(2)}`);
        }
     }
  }
}
run();
