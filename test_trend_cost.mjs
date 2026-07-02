import { createClient } from "@supabase/supabase-js";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";

const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

async function run() {
  const cutoffDate = "2026-01-01";
  const todayStr = "2026-07-01";
  const today = new Date("2026-07-01");

  const { data: monthlyCosts } = await supabase.rpc("get_project_costs_monthly", {
    _start_date: cutoffDate,
    _end_date: todayStr,
  });
  
  const monthlyCostMap = new Map();
  for (const row of monthlyCosts) {
    if (!monthlyCostMap.has(row.project_id)) monthlyCostMap.set(row.project_id, new Map());
    monthlyCostMap.get(row.project_id).set(row.month_date, {
      costGbp: Number(row.cost_gbp_staff) || 0,
      costUsd: Number(row.cost_usd_staff) || 0,
    });
  }
  
  const allProjects = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("projects").select("id").range(from, from + 999);
    allProjects.push(...(data || []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
    
  let hasCost = 0;
  
  const lastFullMonth = startOfMonth(today);
  const allMonths = eachMonthOfInterval({
    start: startOfMonth(new Date(cutoffDate)),
    end: lastFullMonth,
  });
  const months = allMonths.filter((m) => m < lastFullMonth);
  
  for (const p of allProjects) {
    const projMonthlyCost = monthlyCostMap.get(p.id);
    for (const month of months) {
      const monthKey = format(month, "yyyy-MM-01");
      const mc = projMonthlyCost?.get(monthKey);
      if (mc && (mc.costGbp > 0 || mc.costUsd > 0)) {
        hasCost++;
      }
    }
  }
  
  console.log("hasCost matches:", hasCost);
}

run();
