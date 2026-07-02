import { createClient } from "@supabase/supabase-js";
import { format, startOfMonth, eachMonthOfInterval, endOfMonth, isWeekend, eachDayOfInterval } from "date-fns";

const supabase = createClient("https://hyfgyfuvligacjwxjnce.supabase.co", "sb_secret_GNp6xr3aVo_IggfTL-H3Fg_sVSCFvv3");

function getWorkingDays(start, end) {
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
}

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
    const { data } = await supabase.from("projects").select("id, title, ultimate_parent, office, start_date, end_date, rate_card_id, rate_card_discount, fee_calc_currency, fx_rate_gbp, fx_rate_usd, price, revenue, media_cost, gross_budget, extra_data").range(from, from + 999);
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
  
  const perProjectMonths = [];
  
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
    const afMediaCost = p.media_cost ?? getExtraNum(p, "media cost", "cost - paid media budget") ?? 0;
    const afGrossBudget = p.gross_budget ?? getExtraNum(p, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget") ?? 0;
    const fullAgencyFee = afPrice !== null ? afPrice - afMediaCost - afGrossBudget : null;
    
    if (fullAgencyFee > 0) {
      let fxRateGbp = p.fx_rate_gbp || 1;
      let fxRateUsd = p.fx_rate_usd || 1.25;
      let projectCurrency = p.fee_calc_currency || "GBP";
      
      const projStart = new Date(p.start_date);
      const projEnd = new Date(p.end_date);
      const totalDays = getWorkingDays(projStart, projEnd);
      
      const monthlyRevenue = {};
      if (totalDays > 0) {
        const projMonths = eachMonthOfInterval({ start: startOfMonth(projStart), end: startOfMonth(projEnd) });
        for (const m of projMonths) {
          const mEnd = endOfMonth(m);
          const overlapStart = m < projStart ? projStart : m;
          const overlapEnd = mEnd > projEnd ? projEnd : mEnd;
          const overlapDays = getWorkingDays(overlapStart, overlapEnd);
          const monthKey = format(m, "yyyy-MM-01");
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + fullAgencyFee * (overlapDays / totalDays);
        }
      }
      
      const projMonthlyCost = monthlyCostMap.get(p.id);
      
      for (const month of months) {
        const monthKey = format(month, "yyyy-MM-01");
        const revInProjCurrency = monthlyRevenue[monthKey] || 0;
        const revDisplay = revInProjCurrency; // ignoring currency conversion for test
        
        let baseCostDisplay = 0;
        const mc = projMonthlyCost?.get(monthKey);
        if (mc) {
          const costInProject = mc.costGbp * fxRateGbp + mc.costUsd * fxRateUsd;
          baseCostDisplay = costInProject;
        }
        
        if (revDisplay === 0 && baseCostDisplay === 0) continue;
        
        perProjectMonths.push({
          monthKey,
          revDisplay,
          baseCostDisplay,
        });
      }
    }
  }
  
  const overall = {};
  for (const e of perProjectMonths) {
    let costDisplay = e.baseCostDisplay;
    const profit = e.revDisplay - costDisplay;
    if (!overall[e.monthKey]) overall[e.monthKey] = { revenue: 0, cost: 0, profit: 0 };
    overall[e.monthKey].revenue += e.revDisplay;
    overall[e.monthKey].cost += costDisplay;
    overall[e.monthKey].profit += profit;
  }
  
  for (const m in overall) {
    const d = overall[m];
    const margin = d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0;
    console.log(m, "Revenue:", Math.round(d.revenue), "Cost:", Math.round(d.cost), "Margin:", margin + "%");
  }
}

run();
