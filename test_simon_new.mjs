import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch'; // Polyfill for fetch in node if needed
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const WORKING_DAYS_PER_YEAR = 222;
const HOURS_PER_DAY = 7.5;
const WORKING_HOURS_PER_YEAR = WORKING_DAYS_PER_YEAR * HOURS_PER_DAY; // 1665

function getDailyCapacity(billableCapacityHours) {
  return billableCapacityHours / 5;
}

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (HOURS_PER_DAY * 5) : billableCapacityHours;
  const dailyBillableHours = getDailyCapacity(weeklyCapacity);
  const billableCapacityPct = dailyBillableHours / HOURS_PER_DAY;
  const billableHoursPerYear = WORKING_HOURS_PER_YEAR * billableCapacityPct;
  return annualSalary / billableHoursPerYear;
}

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();

// Fetch live API rate
const resp = await fetch(`https://api.frankfurter.app/${project.start_date}..${project.end_date}?base=GBP&symbols=USD`);
const data = await resp.json();
let sum = 0, count = 0;
for (const [date, currencies] of Object.entries(data.rates || {})) {
  const usd = currencies.USD;
  if (usd) { sum += usd; count++; }
}
const historicalFxRate = count > 0 ? sum / count : 1.25;

console.log("Live API Project histRate:", historicalFxRate);

const fxRateGbp = historicalFxRate;

const c1 = calculateInternalCostPerHour(228545.7, 11.25);
const c2 = calculateInternalCostPerHour(208061.7, 11.25);

console.log("Record 1 (salary 228545.7, cap 11.25)");
console.log("  GBP Cost / Hr: £" + c1.toFixed(2));
console.log("  USD Cost / Hr: $" + (c1 * fxRateGbp).toFixed(2));

console.log("Record 2 (salary 208061.7, cap 11.25)");
console.log("  GBP Cost / Hr: £" + c2.toFixed(2));
console.log("  USD Cost / Hr: $" + (c2 * fxRateGbp).toFixed(2));
