import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabase = createClient(process.env.VITE_SUPABASE_URL, "sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh");
import { parseISO, eachDayOfInterval, isWeekend, endOfMonth, differenceInCalendarDays, startOfMonth, subMonths, format } from "date-fns";

async function run() {
  const cutoffDate = "2026-03-01";
  const endDateStr = "2026-08-31";
  
  const { data: timesheets } = await supabase.rpc("get_utilisation_summary_monthly", { _start_date: cutoffDate, _end_date: endDateStr });
  const { data: projs } = await supabase.from("projects").select("id, title, start_date, end_date, revenue, ultimate_parent, office, fx_rate_gbp, fx_rate_usd, fee_calc_currency").ilike("title", "%King%");
  const kingIds = new Set(projs.map(p => p.id));
  
  const { data: monthCostsRaw } = await supabase.rpc("get_project_costs_monthly", { _start_date: cutoffDate, _end_date: endDateStr });
  const monthCosts = monthCostsRaw || [];
  
  const costMap = {};
  for (const row of monthCosts) {
    if (!costMap[row.project_id]) costMap[row.project_id] = { totalHours: 0, costGbp: 0, costUsd: 0 };
    costMap[row.project_id].totalHours += row.total_hours || 0;
    costMap[row.project_id].costGbp += row.cost_gbp_staff || 0;
    costMap[row.project_id].costUsd += row.cost_usd_staff || 0;
  }
  
  let groupRev = 0;
  let groupCost = 0;
  const targetMonths = ["2026-03-01", "2026-04-01", "2026-05-01", "2026-06-01", "2026-07-01", "2026-08-01"];
  
  for (const p of projs) {
     let revenue = 0;
     const projStart = p.start_date ? parseISO(p.start_date) : null;
     const projEnd = p.end_date ? parseISO(p.end_date) : null;
     if (!projStart || !projEnd || projStart > projEnd || projEnd < parseISO(cutoffDate) || projStart > parseISO(endDateStr)) {
        continue; // Project is fully outside window
     }
     
     const fullRev = p.revenue || 0;
     const allWorkingDays = eachDayOfInterval({ start: projStart, end: projEnd }).filter((d) => !isWeekend(d));
     const totalDays = allWorkingDays.length;
     
     if (totalDays > 0) {
        if (totalDays < 4) {
          const dailyRev = fullRev / totalDays;
          allWorkingDays.forEach(d => {
             const m = format(d, "yyyy-MM-01");
             if (targetMonths.includes(m)) revenue += dailyRev;
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
             const dailyRev = (fullRev * weight) / qDays;
             const m = format(d, "yyyy-MM-01");
             if (targetMonths.includes(m)) revenue += dailyRev;
          });
        }
     }
     
     const c = costMap[p.id] || { totalHours: 0, costGbp: 0, costUsd: 0 };
     let cost = c.costGbp; // display currency is GBP, fxRateGbp is 1 if null
     groupRev += revenue;
     groupCost += cost;
  }
  
  console.log("Raw Group Margin:", ((groupRev - groupCost) / groupRev * 100).toFixed(2));
}
run();
