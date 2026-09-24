import { useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/calculations";
import { getMonthlyBatchFxRates } from "@/lib/fx";
import { cn } from "@/lib/utils";
import {
  format, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, isWeekend, parseISO,
} from "date-fns";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, ReferenceLine,
} from "recharts";

type OfficeFilter = "Global" | "UK" | "US";

export interface ProjectMonthlyEntry {
  title: string;
  client: string;
  startDate: string;
  endDate: string;
  month: string;
  revenue: number;
  cost: number;
}

interface Props {
  officeFilter: OfficeFilter;
  cutoffDate: string;
  endDate: string;
  displayCurrency: string;
  statusFilter: "all" | "ended";
  includeEfficiencies: boolean;
  grossUpFactors?: Map<string, number>;
  allGrossUpFactors?: Map<string, number>;
  filteredProjects: any[];
  isCore?: boolean;
  allocatedClients?: string[];
  onTrendData?: (data: {
    overall: Array<{ month: string; revenue: number; cost: number; profit: number; margin: number }>;
    byProject: ProjectMonthlyEntry[];
  }) => void;
}

const EXCLUDED_RECORD_TYPES = [
  "agency - talent savings",
  "agency - passthrough costs",
  "agency - rfp / rfi",
  "agency - holding pot",
];

const matchesOffice = (office: string | null, filter: OfficeFilter) => {
  if (filter === "Global") return true;
  if (!office) return false;
  const o = office.toUpperCase();
  if (filter === "UK") return o === "UK" || o === "UNITED KINGDOM" || o === "COMPANION";
  if (filter === "US") return o === "US" || o === "UNITED STATES";
  return false;
};

function getWorkingDays(start: Date, end: Date): number {
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length;
}

const ProfitabilityTrendChart = ({ officeFilter, cutoffDate, endDate, displayCurrency, statusFilter, includeEfficiencies, grossUpFactors, allGrossUpFactors, filteredProjects, isCore, allocatedClients, onTrendData }: Props) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = format(today, "yyyy-MM-dd");

  // Reuse parent's cached queries (same keys)
  const { data: projects = [] } = useQuery({
    queryKey: ["profitability_projects"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("projects")
          .select("id, title, ultimate_parent, sf_account, office, start_date, end_date, rate_card_id, rate_card_discount, fee_calc_currency, fx_rate_gbp, fx_rate_usd, revenue, price, media_cost, gross_budget, budget_cost, extra_data, opportunity_record_type, project_scopes(id, scoped_hours, role_id), rate_cards(name, hourly_rate, currency)")
          .order("title")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  const { data: allRateCards = [] } = useQuery({
    queryKey: ["profitability_rate_cards"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("rate_cards")
          .select("id, name, role_id, hourly_rate, currency")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  const { data: projectPhases = [] } = useQuery({
    queryKey: ["profitability_project_phases"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("project_phases")
          .select("id, project_id, start_date, end_date")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  const { data: phaseAllocations = [] } = useQuery({
    queryKey: ["profitability_phase_allocations"],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("phase_allocations")
          .select("phase_id, project_scope_id, hours")
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  // Monthly costs from new RPC
  const { data: monthlyCosts = [] } = useQuery({
    queryKey: ["profitability_monthly_costs", cutoffDate, endDate],
    queryFn: async () => {
      const PAGE_SIZE = 1000;
      let allData: any[] = [];
      let from = 0;
      while (true) {
        const { data, error } = await (supabase.rpc as any)("get_project_costs_monthly", {
          _start_date: cutoffDate,
          _end_date: endDate,
        }).range(from, from + PAGE_SIZE - 1);
        if (error) throw error;
        allData = allData.concat(data || []);
        if (!data || data.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      return allData as Array<{
        project_id: string;
        month_date: string;
        total_hours: number;
        cost_gbp_staff: number;
        cost_usd_staff: number;
      }>;
    },
  });

  // Build monthly cost lookup
  const monthlyCostMap = useMemo(() => {
    const map = new Map<string, Map<string, { costGbp: number; costUsd: number }>>();
    for (const row of monthlyCosts) {
      if (!map.has(row.project_id)) map.set(row.project_id, new Map());
      map.get(row.project_id)!.set(row.month_date, {
        costGbp: Number(row.cost_gbp_staff) || 0,
        costUsd: Number(row.cost_usd_staff) || 0,
      });
    }
    return map;
  }, [monthlyCosts]);

  const { data: monthlyFxRates = {} } = useQuery({
    queryKey: ["monthly_batch_fx_rates", cutoffDate, endDate],
    queryFn: () => getMonthlyBatchFxRates(cutoffDate, endDate),
    staleTime: Infinity,
  });

  const { data: talentEfficiencies = [] } = useQuery({
    queryKey: ["profitability_talent_efficiencies", cutoffDate, endDate],
    queryFn: async () => {
      const allData: any[] = [];
      let from = 0;
      const pageSize = 1000;
      while (true) {
        const { data, error } = await supabase
          .from("talent_efficiencies")
          .select("*")
          .gte("month_date", cutoffDate)
          .lte("month_date", endDate)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        allData.push(...(data || []));
        if (!data || data.length < pageSize) break;
        from += pageSize;
      }
      return allData;
    },
  });

  // Compute a fallback GBP/USD rate from projects that have real FX rates
  const fallbackGbpUsdRate = useMemo(() => {
    const ratios: number[] = [];
    for (const p of projects as any[]) {
      if (p.fx_rate_gbp && p.fx_rate_usd && p.fx_rate_gbp > 0) {
        ratios.push(p.fx_rate_usd / p.fx_rate_gbp);
      }
    }
    if (ratios.length === 0) return 1.27;
    ratios.sort((a, b) => a - b);
    return ratios[Math.floor(ratios.length / 2)];
  }, [projects]);

  const _baseTrend = useMemo(() => {
    // Determine the end of the interval (the earliest between the selected endDate and the last full month)
    const lastFullMonth = startOfMonth(today);
    const selectedEnd = parseISO(endDate);
    
    // If the selected end date is in the future or current month, cap at last full month to avoid incomplete data.
    // Otherwise, cap at the selected end date's month start.
    const effectiveEndMonth = selectedEnd < lastFullMonth ? startOfMonth(selectedEnd) : lastFullMonth;

    const allMonths = eachMonthOfInterval({
      start: startOfMonth(parseISO(cutoffDate)),
      end: effectiveEndMonth,
    });
    // Include the effectiveEndMonth itself in the chart if it's strictly before lastFullMonth, 
    // or if the user explicitly requested up to an end date. 
    // Actually, if we just use `allMonths` it includes the `effectiveEndMonth`.
    // Wait, let's just use allMonths up to effectiveEndMonth.
    // We only exclude `lastFullMonth` if it's the current incomplete month.
    const months = allMonths.filter((m) => m < lastFullMonth || m.getTime() === effectiveEndMonth.getTime());

    const filtered = filteredProjects;

    // Pre-compute per-project monthly revenue
    interface ProjectCalc {
      id: string;
      title: string;
      office: string | null;
      client: string;
      startDate: string;
      endDate: string;
      projectCurrency: string;
      fxRateGbp: number;
      fxRateUsd: number;
      monthlyRevenue: Record<string, number>;
    }

    const projectCalcs: ProjectCalc[] = [];

    for (const project of filtered) {
      const p = project as any;
      const projectCurrency = p.fee_calc_currency || p.rate_cards?.currency || (p.office === "United States" ? "USD" : "GBP");
      let fxRateGbp: number;
      let fxRateUsd: number;
      if (p.fx_rate_gbp || p.fx_rate_usd) {
        fxRateGbp = p.fx_rate_gbp || 1;
        fxRateUsd = p.fx_rate_usd || (fxRateGbp * fallbackGbpUsdRate);
      } else if (projectCurrency === "USD") {
        fxRateGbp = fallbackGbpUsdRate;
        fxRateUsd = 1;
      } else if (projectCurrency === "GBP") {
        fxRateGbp = 1;
        fxRateUsd = 1 / fallbackGbpUsdRate;
      } else {
        fxRateGbp = 1;
        fxRateUsd = fallbackGbpUsdRate;
      }
      const rateCardBaseCurrency = p.rate_cards?.currency || "GBP";
      const discountPct = p.rate_card_discount || 0;
      const rcName = p.rate_cards?.name;

      const roleRates: Record<string, number> = {};
      if (rcName) {
        const targetName = rcName.trim().toLowerCase();
        allRateCards
          .filter((rc: any) => (rc.name || "").trim().toLowerCase() === targetName)
          .forEach((rc: any) => {
            let rate = Number(rc.hourly_rate || 0) * (1 - discountPct / 100);
            if (rateCardBaseCurrency !== projectCurrency) {
              if (rateCardBaseCurrency === "GBP") rate *= fxRateGbp;
              else if (rateCardBaseCurrency === "USD") rate *= fxRateUsd;
            }
            roleRates[rc.role_id] = rate;
          });
      }

      // Agency fee
      const getExtraNum = (proj: any, ...keys: string[]): number | null => {
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

      const projAfPrice = getExtraNum(p, "project_currency_revenue") ?? p.price ?? p.revenue ?? getExtraNum(p, "total price", "price gbp/usd", "price");
      const projAfMediaCost = getExtraNum(p, "project_currency_media_cost") ?? p.media_cost ?? getExtraNum(p, "media cost", "cost - paid media budget") ?? 0;
      const projAfGrossBudget = getExtraNum(p, "project_currency_gross_budget") ?? p.gross_budget ?? getExtraNum(p, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget") ?? 0;

      const afPrice = p.price ?? p.revenue ?? getExtraNum(p, "total price", "price gbp/usd", "price");
      
      const revenueFxRatio = (projAfPrice && afPrice && afPrice > 0) 
        ? projAfPrice / afPrice 
        : 1;

      let afMediaCost = p.media_cost ?? getExtraNum(p, "media cost", "cost - paid media budget");
      if (afMediaCost == null) afMediaCost = projAfMediaCost / revenueFxRatio;
      
      let afGrossBudget = p.gross_budget ?? getExtraNum(p, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget");
      if (afGrossBudget == null) afGrossBudget = projAfGrossBudget / revenueFxRatio;

      const fullAgencyFee = afPrice !== null ? afPrice - afMediaCost - afGrossBudget : null;

      const rateCardRevenue = (p.project_scopes || []).reduce((sum: number, sc: any) => {
        return sum + sc.scoped_hours * (roleRates[sc.role_id] || 0);
      }, 0);
      const agencyFee = fullAgencyFee !== null && fullAgencyFee > 0 ? fullAgencyFee : rateCardRevenue;
      if (agencyFee <= 0) continue;

      // Monthly revenue using phases or linear fallback
      const projStart = parseISO(p.start_date);
      const projEnd = parseISO(p.end_date);
      const monthlyRevenue: Record<string, number> = {};

      const projPhases = projectPhases.filter((ph: any) => ph.project_id === p.id);
      const projPhaseIds = new Set(projPhases.map((ph: any) => ph.id));
      const projPhaseAllocs = phaseAllocations.filter((pa: any) => projPhaseIds.has(pa.phase_id));
      
      let totalAllocatedValue = 0;
      for (const pa of projPhaseAllocs) {
        const scope = (p.project_scopes || []).find((sc: any) => sc.id === pa.project_scope_id);
        const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
        totalAllocatedValue += Number(pa.hours) * rate;
      }
      
      const hasPhaseData = projPhases.length > 0 && projPhaseAllocs.length > 0 && totalAllocatedValue > 0;

      if (hasPhaseData) {
        for (const phase of projPhases) {
          if (!phase.start_date || !phase.end_date) continue;
          const phaseStart = parseISO(phase.start_date);
          const phaseEnd = parseISO(phase.end_date);

          const phaseValue = projPhaseAllocs
            .filter((pa: any) => pa.phase_id === phase.id)
            .reduce((sum: number, pa: any) => {
              const scope = (p.project_scopes || []).find((sc: any) => sc.id === pa.project_scope_id);
              const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
              return sum + Number(pa.hours) * rate;
            }, 0);

          const phaseFee = agencyFee * (phaseValue / totalAllocatedValue);
          if (phaseFee <= 0) continue;

          const totalPhaseDays = getWorkingDays(phaseStart, phaseEnd);
          if (totalPhaseDays === 0) continue;

          const phaseMonths = eachMonthOfInterval({ start: startOfMonth(phaseStart), end: startOfMonth(phaseEnd) });
          for (const m of phaseMonths) {
            const mEnd = endOfMonth(m);
            const overlapStart = m < phaseStart ? phaseStart : m;
            const overlapEnd = mEnd > phaseEnd ? phaseEnd : mEnd;
            const overlapDays = getWorkingDays(overlapStart, overlapEnd);
            const monthKey = format(m, "yyyy-MM-01");
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + phaseFee * (overlapDays / totalPhaseDays);
          }
        }
      } else {
        const totalDays = getWorkingDays(projStart, projEnd);
        if (totalDays > 0) {
          const projMonths = eachMonthOfInterval({ start: startOfMonth(projStart), end: startOfMonth(projEnd) });
          for (const m of projMonths) {
            const mEnd = endOfMonth(m);
            const overlapStart = m < projStart ? projStart : m;
            const overlapEnd = mEnd > projEnd ? projEnd : mEnd;
            const overlapDays = getWorkingDays(overlapStart, overlapEnd);
            const monthKey = format(m, "yyyy-MM-01");
            monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + agencyFee * (overlapDays / totalDays);
          }
        }
      }

      const isTE = p.opportunity_record_type?.toLowerCase() === "agency - talent savings" || (p.title || "").toLowerCase().includes("talent savings") || (p.title || "").toLowerCase().includes("talent efficiencies");
      projectCalcs.push({ id: p.id, title: p.title, office: p.office, client: p.ultimate_parent || p.title, startDate: p.start_date, endDate: p.end_date, projectCurrency, fxRateGbp, fxRateUsd, monthlyRevenue, isTE });
    }

    // Currency conversion helper
    const toDisplay = (value: number, projectCurrency: string, fxGbp: number, fxUsd: number, monthKey?: string) => {
      if (projectCurrency === displayCurrency) return value;
      
      // Use monthly rate if available, otherwise fall back to project rate
      let gbpToUsd = fxUsd > 0 ? fxGbp / fxUsd : 1;
      let monthRate = monthKey ? monthlyFxRates[monthKey] : null;
      if (monthRate) {
        gbpToUsd = monthRate;
      }

      let inGBP = value;
      if (projectCurrency === "USD") inGBP = value / gbpToUsd;
      else if (projectCurrency !== "GBP") {
        // If we have a monthly rate, we assume project is non-GBP/USD? 
        // Actually the API only returns GBP->USD. 
        // If project is e.g. EUR, we still use the project-level fx_rate_gbp.
        inGBP = value / (fxGbp || 1);
      }
      
      if (displayCurrency === "GBP") return inGBP;
      if (displayCurrency === "USD") return inGBP * gbpToUsd;
      return inGBP;
    };

    // Build per-project per-month entries WITHOUT gross-up applied.
    // Gross-up is applied in a downstream memo so toggling it doesn't
    // re-run this expensive computation.
    type PerProjectMonth = {
      id: string;
      title: string;
      client: string;
      startDate: string;
      endDate: string;
      monthKey: string;
      monthLabel: string;
      revDisplay: number;
      baseCostDisplay: number;
    };
    const perProjectMonths: PerProjectMonth[] = [];

    for (const pc of projectCalcs) {
      const projMonthlyCost = monthlyCostMap.get(pc.id);

      for (const month of months) {
        const monthKey = format(month, "yyyy-MM-01");
        const revInProjCurrency = pc.monthlyRevenue[monthKey] || 0;
        const revDisplay = toDisplay(revInProjCurrency, pc.projectCurrency, pc.fxRateGbp, pc.fxRateUsd, monthKey);

        let baseCostDisplay = 0;
        const mc = projMonthlyCost?.get(monthKey);
        if (mc) {
          const costInProject = mc.costGbp * pc.fxRateGbp + mc.costUsd * pc.fxRateUsd;
          baseCostDisplay = toDisplay(costInProject, pc.projectCurrency, pc.fxRateGbp, pc.fxRateUsd, monthKey);
        }

        if (revDisplay === 0 && baseCostDisplay === 0) continue;

        perProjectMonths.push({
          id: pc.id,
          title: pc.title,
          client: pc.client,
          startDate: pc.startDate,
          endDate: pc.endDate,
          monthKey,
          monthLabel: format(month, "MMM yy"),
          revDisplay,
          baseCostDisplay,
          isTE: pc.isTE,
        });
      }
    }

    return { months, perProjectMonths };
  }, [filteredProjects, allRateCards, projectPhases, phaseAllocations, monthlyCostMap, officeFilter, cutoffDate, displayCurrency, today, todayStr, statusFilter, fallbackGbpUsdRate, includeEfficiencies]);

  // Apply gross-up factors + aggregate. Cheap — re-runs instantly on toggle.
  const _computedTrend = useMemo(() => {
    const { months, perProjectMonths } = _baseTrend;
    type Bucket = { revenue: number; cost: number; profit: number; efficiencies: number; teContributors: { name: string; amount: number }[] };
    const overall: Record<string, Bucket> = {};
    const byProject: ProjectMonthlyEntry[] = [];

    // Initialize all months
    for (const m of months) {
      const k = format(m, "yyyy-MM-01");
      overall[k] = { revenue: 0, cost: 0, profit: 0, efficiencies: 0, teContributors: [] };
    }

    for (const e of perProjectMonths) {
      let costDisplay = e.baseCostDisplay;
      if (costDisplay) {
        const factor = grossUpFactors?.get(e.id);
        if (factor && factor > 1) costDisplay *= factor;
      }
      const profit = e.revDisplay - costDisplay;

      if (!overall[e.monthKey]) overall[e.monthKey] = { revenue: 0, cost: 0, profit: 0, efficiencies: 0, teContributors: [] };
      
      if (e.isTE) {
        overall[e.monthKey].efficiencies += e.revDisplay;
        overall[e.monthKey].teContributors.push({ name: e.title, amount: e.revDisplay });
      } else {
        overall[e.monthKey].revenue += e.revDisplay;
        overall[e.monthKey].cost += costDisplay;
        overall[e.monthKey].profit += profit;
      }

      if (Math.round(e.revDisplay) !== 0 || Math.round(costDisplay) !== 0) {
        byProject.push({
          title: e.title,
          client: e.client,
          startDate: e.startDate,
          endDate: e.endDate,
          month: e.monthLabel,
          revenue: Math.round(e.revDisplay),
          cost: Math.round(costDisplay),
        });
      }
    }


const projectOfficeMap = new Map();
    for (const p of projects) {
      if (p.title) projectOfficeMap.set(p.title.trim().toLowerCase(), p.office);
    }
    
    if (includeEfficiencies) {
      for (const eff of talentEfficiencies) {
        
        const oppName = eff.opportunity_name || "Unknown Opportunity";
        const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
        let effOffice = eff.office;
        if (!effOffice || effOffice === "Unknown") {
          effOffice = projectOfficeMap.get(cleanName) || effOffice;
        }
        
        if (!matchesOffice(effOffice, officeFilter)) continue;
        
        if (isCore && allocatedClients) {
          let matchedClient = "Unassigned / Other";
          const matchedProject = projects.find((p: any) => p.title && p.title.trim().toLowerCase() === cleanName);
          if (matchedProject) {
            matchedClient = matchedProject.ultimate_parent || matchedProject.title || matchedClient;
          } else {
             const possibleClients = [...allocatedClients].sort((a,b) => b.length - a.length);
             for (const pc of possibleClients) {
               if (pc && pc.length > 2 && oppName.toLowerCase().startsWith(pc.toLowerCase())) {
                  matchedClient = pc;
                  break;
               }
             }
          }
          if (!allocatedClients.some(ac => ac.toLowerCase() === matchedClient.toLowerCase())) {
            continue;
          }
        }
        
        const k = eff.month_date;
        if (!overall[k]) continue;
        
                let displayAmount = Number(eff.amount) || 0;
        if (displayCurrency === "USD" && effOffice !== "United States" && effOffice !== "US") {
          const monthRate = monthlyFxRates[k];
          const gbpToUsd = monthRate || fallbackGbpUsdRate || 1.27;
          displayAmount *= gbpToUsd;
        } else if (displayCurrency === "GBP" && (effOffice === "United States" || effOffice === "US")) {
          const monthRate = monthlyFxRates[k];
          const gbpToUsd = monthRate || fallbackGbpUsdRate || 1.27;
          displayAmount /= gbpToUsd;
        }
        
        overall[k].efficiencies += displayAmount;
        overall[k].teContributors.push({ name: eff.opportunity_name || "Contingency", amount: displayAmount });
      }
    }

    const overallArr = months.map((m) => {
      const k = format(m, "yyyy-MM-01");
      const d = overall[k];

      const topTEs = [...d.teContributors]
        .reduce((acc, curr) => {
          const existing = acc.find(x => x.name === curr.name);
          if (existing) {
            existing.amount += curr.amount;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      return {
        topTEs,
        month: format(m, "MMM yy"),
        revenue: Math.round(d.revenue),
        cost: Math.round(d.cost),
        profit: Math.round(d.profit),
        efficiencies: Math.round(d.efficiencies),
        totalProfit: Math.round(d.profit + d.efficiencies),
        margin: (d.revenue + d.efficiencies) > 0 ? Math.round(((d.profit + d.efficiencies) / (d.revenue + d.efficiencies)) * 100) : 0,
      };
    });

    return { overallArr, byProject };
  }, [_baseTrend, grossUpFactors, includeEfficiencies, talentEfficiencies, officeFilter, displayCurrency, monthlyFxRates, fallbackGbpUsdRate]);

  const overallData = _computedTrend.overallArr;
  const projectMonthlyData = _computedTrend.byProject;

  // Emit trend data to parent (only when values actually change)
  const prevTrendRef = useRef<string>("");
  useEffect(() => {
    if (!onTrendData || overallData.length === 0) return;
    const key = JSON.stringify({ o: overallData, b: projectMonthlyData.length });
    if (key === prevTrendRef.current) return;
    prevTrendRef.current = key;
    onTrendData({ overall: overallData, byProject: projectMonthlyData });
  }, [overallData, projectMonthlyData, onTrendData]);

  // Compute the same data with allGrossUpFactors to determine fixed Y-axis domain
  const altOverallData = useMemo(() => {
    if (!allGrossUpFactors?.size) return overallData;
    // If current grossUpFactors equals allGrossUpFactors, compute without (empty factors)
    const isCurrentlyGrossedUp = grossUpFactors?.size === allGrossUpFactors.size;
    const altFactors = isCurrentlyGrossedUp ? new Map<string, number>() : allGrossUpFactors;

    const { months, perProjectMonths } = _baseTrend;
    type Bucket = { revenue: number; cost: number; profit: number; efficiencies: number; teContributors: { name: string; amount: number }[] };
    const overall: Record<string, Bucket> = {};

    for (const m of months) {
      const k = format(m, "yyyy-MM-01");
      overall[k] = { revenue: 0, cost: 0, profit: 0, efficiencies: 0, teContributors: [] };
    }

    for (const e of perProjectMonths) {
      let costDisplay = e.baseCostDisplay;
      if (costDisplay) {
        const factor = altFactors.get(e.id);
        if (factor && factor > 1) costDisplay *= factor;
      }
      const profit = e.revDisplay - costDisplay;

      if (!overall[e.monthKey]) overall[e.monthKey] = { revenue: 0, cost: 0, profit: 0, efficiencies: 0, teContributors: [] };
      
      if (e.isTE) {
        overall[e.monthKey].efficiencies += e.revDisplay;
        overall[e.monthKey].teContributors.push({ name: e.title, amount: e.revDisplay });
      } else {
        overall[e.monthKey].revenue += e.revDisplay;
        overall[e.monthKey].cost += costDisplay;
        overall[e.monthKey].profit += profit;
      }
    }
const projectOfficeMap = new Map();
    for (const p of projects) {
      if (p.title) projectOfficeMap.set(p.title.trim().toLowerCase(), p.office);
    }
    
    if (includeEfficiencies) {
      for (const eff of talentEfficiencies) {
        if (eff.efficiency_type !== "Contingency") continue;
        
        const oppName = eff.opportunity_name || "Unknown Opportunity";
        const cleanName = oppName.replace(/\s*[-–:]?\s*Talent\s+(Efficiencies|Savings)$/i, "").trim().toLowerCase();
        let effOffice = eff.office;
        if (!effOffice || effOffice === "Unknown") {
          effOffice = projectOfficeMap.get(cleanName) || effOffice;
        }
        
        if (!matchesOffice(effOffice, officeFilter)) continue;
        
        const k = eff.month_date;
        if (!overall[k]) continue;
        
                let displayAmount = Number(eff.amount) || 0;
        if (displayCurrency === "USD" && effOffice !== "United States" && effOffice !== "US") {
          const monthRate = monthlyFxRates[k];
          const gbpToUsd = monthRate || fallbackGbpUsdRate || 1.27;
          displayAmount *= gbpToUsd;
        } else if (displayCurrency === "GBP" && (effOffice === "United States" || effOffice === "US")) {
          const monthRate = monthlyFxRates[k];
          const gbpToUsd = monthRate || fallbackGbpUsdRate || 1.27;
          displayAmount /= gbpToUsd;
        }
        
        overall[k].efficiencies += displayAmount;
        overall[k].teContributors.push({ name: eff.opportunity_name || "Contingency", amount: displayAmount });
      }
    }

    return months.map((m) => {
      const k = format(m, "yyyy-MM-01");
      const d = overall[k];

      const topTEs = [...d.teContributors]
        .reduce((acc, curr) => {
          const existing = acc.find(x => x.name === curr.name);
          if (existing) {
            existing.amount += curr.amount;
          } else {
            acc.push({ ...curr });
          }
          return acc;
        }, [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3);

      return {
        topTEs,
        month: format(m, "MMM yy"),
        revenue: Math.round(d.revenue),
        cost: Math.round(d.cost),
        profit: Math.round(d.profit),
        efficiencies: Math.round(d.efficiencies),
        totalProfit: Math.round(d.profit + d.efficiencies),
        margin: (d.revenue + d.efficiencies) > 0 ? Math.round(((d.profit + d.efficiencies) / (d.revenue + d.efficiencies)) * 100) : 0,
      };
    });
  }, [_baseTrend, grossUpFactors, allGrossUpFactors, overallData, includeEfficiencies, talentEfficiencies, officeFilter, displayCurrency, monthlyFxRates, fallbackGbpUsdRate]);

  // Compute Y-axis domain dynamically based on currently visible data
  const profitYDomain = useMemo(() => {
    if (!overallData.length) return undefined;
    const currentProfits = overallData.map(d => d.totalProfit);
    
    const minProfit = Math.min(...currentProfits);
    const maxProfit = Math.max(...currentProfits);
    const padding = (maxProfit - minProfit) * 0.1;
    
    let domainMin = Math.floor((minProfit - padding) / 50000) * 50000;
    const domainMax = Math.ceil((maxProfit + padding) / 50000) * 50000;

    // Prevent padding from pushing a purely non-negative dataset into negative territory
    if (minProfit >= 0 && domainMin < 0) {
      domainMin = 0;
    }
    
    return [domainMin, domainMax] as [number, number];
  }, [overallData]);

  if (overallData.length <= 1) return null;

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Profitability Over Time</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">Monthly profit trend · Revenue proportioned by phase allocations · {displayCurrency}</p>
        </div>

        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={overallData} margin={{ top: 10, right: 30, bottom: 10, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis
                yAxisId="profit"
                tickFormatter={(v) => formatCurrency(v, displayCurrency)}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={80}
                domain={profitYDomain}
              />
              <YAxis
                yAxisId="margin"
                orientation="right"
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                width={45}
                domain={[0, 100]}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-lg border border-border/50 bg-background px-3 py-2 text-xs shadow-xl min-w-[200px]">
                      <p className="font-medium mb-2 pb-1 border-b border-border/50">{d.month}</p>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground">Agency Fee:</span>
                        <span className="font-medium text-foreground">{formatCurrency(d.revenue, displayCurrency)}</span>
                      </div>
                      {d.efficiencies !== 0 && (
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-muted-foreground">TEs:</span>
                          <span className="font-medium text-foreground">{formatCurrency(d.efficiencies, displayCurrency)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mb-1 pt-1 border-t border-border/50">
                        <span className="text-muted-foreground">Total Gross Profit:</span>
                        <span className="font-medium text-foreground">{formatCurrency(d.revenue + d.efficiencies, displayCurrency)}</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground">Internal Costs:</span>
                        <span className="font-medium text-foreground">{formatCurrency(d.cost, displayCurrency)}</span>
                      </div>

                      <div className="flex justify-between items-center mb-1 pt-1 border-t border-border/50">
                        <span className="text-muted-foreground font-semibold">Total Profit:</span>
                        <span className={cn("font-medium", d.totalProfit < 0 ? "text-destructive" : "text-success")}>{formatCurrency(d.totalProfit, displayCurrency)}</span>
                      </div>

                      <div className="flex justify-between items-center mt-1 pt-1 border-t border-border/50">
                        <span className="text-muted-foreground font-semibold">Total Margin:</span>
                        <span className="font-medium text-foreground">{d.margin}%</span>
                      </div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-muted-foreground">Margin from agency fees:</span>
                        <span className="font-medium text-foreground">{d.revenue > 0 ? Math.round((d.profit / d.revenue) * 100) : 0}%</span>
                      </div>

                      {d.efficiencies !== 0 && (
                        <div className="flex justify-between items-center mb-1 pt-1 border-t border-border/50">
                          <span className="text-muted-foreground">TE % of total Gross Profit:</span>
                          <span className="font-medium text-foreground">{Math.round((d.efficiencies / (d.revenue + d.efficiencies)) * 100)}%</span>
                        </div>
                      )}

                      {d.efficiencies !== 0 && d.topTEs?.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <p className="text-muted-foreground font-semibold mb-1 uppercase text-[10px] tracking-wider">Top TE Contributors:</p>
                          {d.topTEs.map((te: any, i: number) => (
                            <div key={i} className="flex justify-between items-center mb-0.5 gap-4">
                              <span className="text-[10px] text-muted-foreground truncate max-w-[150px]" title={te.name}>{te.name}</span>
                              <span className="text-[10px] text-foreground font-medium">{formatCurrency(Math.round(te.amount), displayCurrency)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <ReferenceLine yAxisId="profit" y={0} stroke="hsl(var(--border))" />
              <Bar yAxisId="profit" dataKey="profit" stackId="a" radius={overallData.some(d => d.efficiencies !== 0) ? [0, 0, 0, 0] : [4, 4, 0, 0]}>
                {overallData.map((entry, i) => (
                  <Cell key={i} fill={entry.profit >= 0 ? "hsl(142, 71%, 45%)" : "hsl(var(--destructive))"} />
                ))}
              </Bar>
              <Bar yAxisId="profit" dataKey="efficiencies" stackId="a" radius={[4, 4, 0, 0]} fill="hsl(var(--muted-foreground) / 0.5)" />
              <Line
                yAxisId="margin"
                type="monotone"
                dataKey="margin"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 3, fill: "hsl(var(--primary))" }}
                strokeDasharray="4 4"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex items-center justify-center gap-4 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-success" />
            <span className="text-[10px] text-muted-foreground">Agency Fees</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-sm bg-muted-foreground/50" />
            <span className="text-[10px] text-muted-foreground">Efficiencies</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-0.5 bg-primary rounded" style={{ borderTop: "2px dashed" }} />
            <span className="text-[10px] text-muted-foreground">Margin %</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfitabilityTrendChart;
