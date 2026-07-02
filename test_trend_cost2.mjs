import { createClient } from "@supabase/supabase-js";
import { format, startOfMonth, eachMonthOfInterval } from "date-fns";

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
  
  const allData = [];
  let from = 0;
  while (true) {
    const { data } = await supabase.from("projects").select("id, start_date, end_date, price, revenue, extra_data").range(from, from + 999);
    allData.push(...(data || []));
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  
  const filtered = allData.filter(p => {
    if (p.start_date < "2025-01-01") return false;
    if (p.end_date < cutoffDate || p.start_date > todayStr) return false;
    return true;
  });
    
  const lastFullMonth = startOfMonth(today);
  const allMonths = eachMonthOfInterval({
    start: startOfMonth(new Date(cutoffDate)),
    end: lastFullMonth,
  });
  const months = allMonths.filter((m) => m < lastFullMonth);
  
  let totalCost = 0;
  
  for (const p of filtered) {
    const getExtraNum = (proj, ...keys) => {
      const extra = proj.extra_data || {};
      const normalised = Object.fromEntries(Object.entries(extra).map(([k, v]) => [k.toLowerCase().trim(), v]));
      for (const k of keys) {
        const val = normalised[k.toLowerCase().trim()];
        if (val != null) {
          const n = parseFloat(String(val).replace(/[£$,%]/g, "").replace(/,/g, ""));
          if (!isNaN(n)) return n;
        }
      }
      return null;
    };
    
    const afPrice = p.price ?? p.revenue ?? getExtraNum(p, "total price", "price gbp/usd", "price");
    
    if (afPrice > 0) {
      const projMonthlyCost = monthlyCostMap.get(p.id);
      for (const month of months) {
        const monthKey = format(month, "yyyy-MM-01");
        const mc = projMonthlyCost?.get(monthKey);
        if (mc) {
          totalCost += mc.costGbp + mc.costUsd;
        }
      }
    }
  }
  
  console.log("totalCost inside valid projects:", totalCost);
}

run();
