import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const WORKING_DAYS_PER_YEAR = 222;
const HOURS_PER_DAY = 7.5;
const WORKING_HOURS_PER_YEAR = WORKING_DAYS_PER_YEAR * HOURS_PER_DAY; // 1665
const SALARY_MARKUP = 0.15;

function getDailyCapacity(billableCapacityHours) {
  return billableCapacityHours / 5;
}

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (HOURS_PER_DAY * 5) : billableCapacityHours;
  const dailyBillableHours = getDailyCapacity(weeklyCapacity);
  const billableCapacityPct = dailyBillableHours / HOURS_PER_DAY;
  const billableHoursPerYear = WORKING_HOURS_PER_YEAR * billableCapacityPct;
  return (annualSalary * (1 + SALARY_MARKUP)) / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();

const storedGbp = project?.fx_rate_gbp;
const storedUsd = project?.fx_rate_usd;
const histRate = project?.extra_data?.fx_rate_historical || project?.extra_data?.fx_rate || 1.25;

console.log("Project histRate:", histRate);

// According to ProjectDetailPage, activeCurrency for a USD project where office is UK will use:
// activeCurrency = USD
// officeCurrency (person's) = GBP
// So it falls into: `if (activeCurrency === "USD") { fxRateGbp = histRate; fxRateUsd = 1; }`
// Then: `if (!office || office === "UK" || office === "United Kingdom") return costInLocalCurrency * fxRateGbp;`

const fxRateGbp = histRate;

const c1 = calculateInternalCostPerHour(228545.7, null);
const c2 = calculateInternalCostPerHour(208061.7, 11.25);

console.log("Record 1 (salary 228545.7, full capacity)");
console.log("  GBP Cost / Hr: £" + c1.toFixed(2));
console.log("  USD Cost / Hr: $" + (c1 * fxRateGbp).toFixed(2));

console.log("Record 2 (salary 208061.7, cap 11.25)");
console.log("  GBP Cost / Hr: £" + c2.toFixed(2));
console.log("  USD Cost / Hr: $" + (c2 * fxRateGbp).toFixed(2));
