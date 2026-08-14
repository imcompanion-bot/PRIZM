import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const BILLABLE_TEAMS = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data", "production"]);

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? 37.5 : billableCapacityHours;
  const dailyBillableHours = weeklyCapacity / 5;
  const billableCapacityPct = dailyBillableHours / 7.5;
  const billableHoursPerYear = 1665 * billableCapacityPct;
  return (annualSalary * 1.15) / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Wedding%').single();

const { data: timeEntries } = await supabase
    .from("time_entries")
    .select("*, people(name, annual_salary, role_id, team, office, roles(name, billable_capacity_hours))")
    .eq("project_id", project.id);

const getExtraNum = (proj, ...keys) => {
    if (!proj) return null;
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

const officeCurrency = project.office === 'US' || project.office === 'United States' ? 'USD' : 'GBP';
const extraDataProjectCurrency = project.extra_data?.project_currency;
let currencyMode = "project"; // Default for PDP when viewed normally

let baseAgencyFeePrice = project?.price ?? project?.revenue ?? getExtraNum(project, "total price", "price gbp/usd", "price");
let baseAgencyFeeMediaCost = project?.media_cost ?? getExtraNum(project, "media cost", "cost - paid media budget") ?? 0;
let baseAgencyFeeGrossBudget = project?.gross_budget ?? project?.budget_cost ?? getExtraNum(project, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget") ?? 0;
const baseAgencyFee = baseAgencyFeePrice !== null ? baseAgencyFeePrice - baseAgencyFeeMediaCost - baseAgencyFeeGrossBudget : null;

let projAgencyFeePrice = baseAgencyFeePrice;
let projAgencyFeeMediaCost = baseAgencyFeeMediaCost;
let projAgencyFeeGrossBudget = baseAgencyFeeGrossBudget;
const ed = project?.extra_data || {};
if (ed.project_currency_revenue != null) projAgencyFeePrice = ed.project_currency_revenue;
if (ed.project_currency_media_cost != null) projAgencyFeeMediaCost = ed.project_currency_media_cost;
if (ed.project_currency_gross_budget != null) projAgencyFeeGrossBudget = ed.project_currency_gross_budget;
const projAgencyFee = projAgencyFeePrice !== null ? projAgencyFeePrice - projAgencyFeeMediaCost - projAgencyFeeGrossBudget : null;

let implicitFxRatio = null;
if (currencyMode === "project" && projAgencyFee !== null && baseAgencyFee !== null && baseAgencyFee !== 0) {
  implicitFxRatio = projAgencyFee / baseAgencyFee;
}

const activeCurrency = currencyMode === "office" ? officeCurrency : (extraDataProjectCurrency || officeCurrency);

// Mock getProjectFxRate
const histRate = getExtraNum(project, "fx_rate_historical", "fx_rate") || 1.25;

let fxRateGbp, fxRateUsd;
const isOriginalCurrency = activeCurrency === (project?.fee_calc_currency || project?.rate_cards?.currency || officeCurrency);
const storedGbp = project?.fx_rate_gbp;
const storedUsd = project?.fx_rate_usd;
if (isOriginalCurrency && (storedGbp || storedUsd)) {
    fxRateGbp = storedGbp || 1;
    fxRateUsd = storedUsd || (fxRateGbp * histRate);
} else if (activeCurrency === "USD") {
    fxRateGbp = histRate;
    fxRateUsd = 1;
} else if (activeCurrency === "GBP") {
    fxRateGbp = 1;
    fxRateUsd = 1 / histRate;
} else {
    fxRateGbp = 1;
    fxRateUsd = histRate;
}

const convertCostToActiveCurrency = (costInLocalCurrency, office) => {
    if (currencyMode === "project" && implicitFxRatio !== null) {
      const personIsUs = office === "US" || office === "United States";
      let costInOfficeCurrency = costInLocalCurrency;
      if (officeCurrency === "GBP") {
        if (personIsUs) costInOfficeCurrency = costInLocalCurrency / histRate;
      } else if (officeCurrency === "USD") {
        if (!personIsUs) costInOfficeCurrency = costInLocalCurrency * histRate;
      }
      return costInOfficeCurrency * implicitFxRatio;
    }
    // Fallback if not using project currency mode or missing ratio
    const personIsUs = office === "US" || office === "United States";
    return personIsUs ? costInLocalCurrency * fxRateUsd : costInLocalCurrency * fxRateGbp;
};

let totalCost = 0;
timeEntries.forEach(te => {
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    const office = te.people?.office || "UK";
    totalCost += te.hours * convertCostToActiveCurrency(costPerHour, office);
});

console.log("implicitFxRatio:", implicitFxRatio);
console.log("totalCost:", totalCost);
