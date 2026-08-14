import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const WORKING_HOURS_PER_YEAR = 1665;
const HOURS_PER_DAY = 7.5;

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (HOURS_PER_DAY * 5) : billableCapacityHours;
  const dailyBillableHours = weeklyCapacity / 5;
  const billableCapacityPct = dailyBillableHours / HOURS_PER_DAY;
  const billableHoursPerYear = WORKING_HOURS_PER_YEAR * billableCapacityPct;
  return annualSalary / billableHoursPerYear;
}

async function run() {
  const { data: projects } = await supabase.from('projects').select('id, title, start_date, end_date, fx_rate_gbp, fx_rate_usd, extra_data, fee_calc_currency');
  const { data: people } = await supabase.from('people').select('id, name, office, annual_salary, roles(billable_capacity_hours)');
  const { data: timeEntries } = await supabase.from('time_entries').select('project_id, person_id, hours');

  const personCostCache = {};
  for (const p of people) {
    if (!p.annual_salary) continue;
    const costPerHour = calculateInternalCostPerHour(p.annual_salary, p.roles?.billable_capacity_hours);
    const isUk = !p.office || p.office.includes('UK') || p.office.includes('United Kingdom');
    personCostCache[p.id] = { costPerHour, isUk };
  }

  // Aggregate hours by project and person
  const projectHours = {};
  for (const t of timeEntries) {
    if (!projectHours[t.project_id]) projectHours[t.project_id] = {};
    if (!projectHours[t.project_id][t.person_id]) projectHours[t.project_id][t.person_id] = 0;
    projectHours[t.project_id][t.person_id] += t.hours;
  }

  // Fetch all rates from API for overall min/max dates to avoid rate limits
  let minDate = '2099-01-01', maxDate = '1970-01-01';
  for (const p of projects) {
    if (p.start_date && p.start_date < minDate) minDate = p.start_date;
    if (p.end_date && p.end_date > maxDate) maxDate = p.end_date;
  }
  
  console.log(`Fetching rates from ${minDate} to ${maxDate}...`);
  const resp = await fetch(`https://api.frankfurter.dev/v1/${minDate}..${maxDate}?base=GBP&symbols=USD`);
  const data = await resp.json();
  const dailyRates = {};
  for (const [date, currencies] of Object.entries(data.rates || {})) {
    if (currencies.USD) dailyRates[date] = currencies.USD;
  }

  let largestIncrease = 0;
  let largestProject = null;
  let details = null;

  for (const p of projects) {
    // Only care if project currency is USD or if they look at USD cost
    // We are just calculating the total GBP cost and seeing the difference when converted to USD.
    let gbpCost = 0;
    let usdCost = 0;
    const hoursMap = projectHours[p.id] || {};
    
    for (const [personId, hours] of Object.entries(hoursMap)) {
      const pData = personCostCache[personId];
      if (!pData) continue;
      if (pData.isUk) {
        gbpCost += hours * pData.costPerHour;
      } else {
        usdCost += hours * pData.costPerHour;
      }
    }

    if (gbpCost === 0) continue;

    // Check if they had a hardcoded rate
    const explicitGbp = p.fx_rate_gbp;
    const explicitUsd = p.fx_rate_usd;
    
    // If they have an explicit rate in DB, it wouldn't have changed, so skip or use it. 
    // Actually, if it has an explicit rate, the fallback wasn't used, so there is no increase.
    if (explicitGbp || explicitUsd) continue;

    // Calculate new historical rate
    let sum = 0, count = 0;
    const start = new Date(p.start_date);
    const end = new Date(p.end_date);
    for (const [dateStr, rate] of Object.entries(dailyRates)) {
      const d = new Date(dateStr);
      if (d >= start && d <= end) { sum += rate; count++; }
    }
    const newRate = count > 0 ? sum / count : 1.25;
    
    // Previously it was hardcoded to 1.25 or what was in extra_data
    let oldRate = 1.25;
    if (p.extra_data) {
      // simulate getExtraNum
      const ed = Object.fromEntries(Object.entries(p.extra_data).map(([k, v]) => [k.toLowerCase().trim(), v]));
      const edRate = ed['fx_rate_historical'] || ed['fx_rate'];
      if (edRate) {
        const parsed = parseFloat(String(edRate).replace(/[^\d.-]/g, ''));
        if (!isNaN(parsed)) oldRate = parsed;
      }
    }

    const oldTotalUsd = usdCost + (gbpCost * oldRate);
    const newTotalUsd = usdCost + (gbpCost * newRate);
    const increase = newTotalUsd - oldTotalUsd;

    if (increase > largestIncrease) {
      largestIncrease = increase;
      largestProject = p;
      details = { oldRate, newRate, gbpCost, increase };
    }
  }

  console.log("Largest Increase Project:", largestProject?.title);
  console.log("Old Rate:", details?.oldRate);
  console.log("New Rate:", details?.newRate?.toFixed(4));
  console.log("Total GBP Cost:", details?.gbpCost.toFixed(2));
  console.log("USD Cost Increase: $" + details?.increase.toFixed(2));
}

run().catch(console.error);
