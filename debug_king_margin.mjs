import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
import { parseISO, differenceInCalendarDays, eachDayOfInterval, isWeekend, endOfMonth } from "date-fns";

async function run() {
  const { data: projs } = await supabase.from("projects").select("id, title, start_date, end_date, revenue").ilike("title", "%King%");
  
  // Prorate revenue for Mar-Aug 2026
  let totalRev = 0;
  const targetMonths = ["2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"];
  
  for (const p of projs) {
     if (!p.start_date || !p.end_date) continue;
     const projStart = parseISO(p.start_date);
     const projEnd = parseISO(p.end_date);
     
     const allWorkingDays = eachDayOfInterval({ start: projStart, end: projEnd }).filter((d) => !isWeekend(d));
     const totalDays = allWorkingDays.length;
     if (totalDays > 0) {
        if (totalDays < 4) {
          const dailyRev = p.revenue / totalDays;
          allWorkingDays.forEach(d => {
             const m = d.toISOString().slice(0, 7) + "-01";
             if (targetMonths.includes(m)) totalRev += dailyRev;
          });
        } else {
          const q1End = Math.floor(totalDays * 0.25);
          const q2End = Math.floor(totalDays * 0.50);
          const q3End = Math.floor(totalDays * 0.75);
          allWorkingDays.forEach((d, i) => {
             let weight = 0;
             let qDays = 1;
             if (i < q1End) { weight = 0.30; qDays = q1End; }
             else if (i < q2End) { weight = 0.30; qDays = q2End - q1End; }
             else if (i < q3End) { weight = 0.20; qDays = q3End - q2End; }
             else { weight = 0.20; qDays = totalDays - q3End; }
             const dailyRev = (p.revenue * weight) / qDays;
             const m = d.toISOString().slice(0, 7) + "-01";
             if (targetMonths.includes(m)) totalRev += dailyRev;
          });
        }
     }
  }
  
  const { data: costs } = await supabase.rpc("get_project_costs_monthly", { _start_date: "2026-03-01", _end_date: "2026-08-31" });
  let totalCost = 0;
  const kingIds = new Set(projs.map(p => p.id));
  for (const c of costs) {
     if (kingIds.has(c.project_id)) {
        totalCost += c.cost_gbp_staff;
     }
  }
  
  console.log("King Mar-Aug 2026 Revenue:", totalRev);
  console.log("King Mar-Aug 2026 Cost:", totalCost);
  console.log("King Mar-Aug 2026 Margin:", ((totalRev - totalCost)/totalRev) * 100 + "%");
}
run();
