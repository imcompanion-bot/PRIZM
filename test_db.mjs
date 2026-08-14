import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const BILLABLE_TEAMS = new Set(["account management", "strategy", "strategy and innovation", "creative team", "paid media", "project management", "business affairs", "data", "production"]);

function getDailyCapacity(billableCapacityHours) {
  return billableCapacityHours / 5;
}

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (7.5 * 5) : billableCapacityHours;
  const dailyBillableHours = getDailyCapacity(weeklyCapacity);
  const billableCapacityPct = dailyBillableHours / 7.5;
  const billableHoursPerYear = 1665 * billableCapacityPct;
  return (annualSalary * 1.15) / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('*, rate_cards(currency, name)').ilike('title', '%Dove Men%Neptune%Wedding%').single();
const { data: timeEntries } = await supabase.from('time_entries').select('*, people(name, annual_salary, role_id, team, office, roles(billable_capacity_hours))').eq('project_id', project.id);
const { data: people } = await supabase.from('people').select('*, roles(billable_capacity_hours)');

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
if (projAgencyFee !== null && baseAgencyFee !== null && baseAgencyFee !== 0) {
    implicitFxRatio = projAgencyFee / baseAgencyFee;
}

const histRate = getExtraNum(project, "fx_rate_historical", "fx_rate") || 1.25;
const officeCurrency = project?.office === "United States" ? "USD" : "GBP";
const activeCurrency = "USD"; // simulating project currency mode

const convertCostToActiveCurrency = (costInLocalCurrency, office) => {
    if (implicitFxRatio !== null) {
      const personIsUs = office === "US" || office === "United States";
      let costInOfficeCurrency = costInLocalCurrency;
      
      if (officeCurrency === "GBP") {
        if (personIsUs) costInOfficeCurrency = costInLocalCurrency / histRate;
      } else if (officeCurrency === "USD") {
        if (!personIsUs) costInOfficeCurrency = costInLocalCurrency * histRate;
      }
      
      return costInOfficeCurrency * implicitFxRatio;
    }

    if (activeCurrency === "GBP" && (!office || office === "UK" || office === "United Kingdom")) return costInLocalCurrency;
    if (activeCurrency === "USD" && (office === "US" || office === "United States")) return costInLocalCurrency;
    if (activeCurrency === "GBP") return costInLocalCurrency / histRate;
    if (activeCurrency === "USD") return costInLocalCurrency * histRate;
    return costInLocalCurrency;
};

console.log("baseAgencyFeePrice:", baseAgencyFeePrice);
console.log("baseAgencyFeeGrossBudget:", baseAgencyFeeGrossBudget);
console.log("baseAgencyFee:", baseAgencyFee);
console.log("projAgencyFee:", projAgencyFee);
console.log("implicitFxRatio:", implicitFxRatio);
console.log("histRate:", histRate);

let totalActualCost = 0;
timeEntries.forEach(te => {
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    const office = te.people.office || "UK";
    const convertedCost = convertCostToActiveCurrency(costPerHour, office);
    const cost = te.hours * convertedCost;
    totalActualCost += cost;
});

console.log("Total Actual Cost:", totalActualCost);
