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

  let minDate = '2099-01-01', maxDate = '1970-01-01';
  for (const p of projects) {
    if (p.start_date && p.start_date < minDate) minDate = p.start_date;
    if (p.end_date && p.end_date > maxDate) maxDate = p.end_date;
  }
  
  const resp = await fetch(`https://api.frankfurter.dev/v1/${minDate}..${maxDate}?base=GBP&symbols=USD`);
  const data = await resp.json();
  const dailyRates = {};
  for (const [date, currencies] of Object.entries(data.rates || {})) {
    if (currencies.USD) dailyRates[date] = currencies.USD;
  }

  for (const p of projects) {
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

    if (p.title.includes('Microsoft')) {
      console.log(p.title);
      console.log("start:", p.start_date, "end:", p.end_date);
      let sum = 0, count = 0;
      const start = new Date(p.start_date);
      const end = new Date(p.end_date);
      for (const [dateStr, rate] of Object.entries(dailyRates)) {
        const d = new Date(dateStr);
        if (d >= start && d <= end) { sum += rate; count++; }
      }
      const newRate = count > 0 ? sum / count : 1.25;
      console.log("newRate:", newRate, "count:", count);
      
      let oldRate = 1.25;
      if (p.extra_data) {
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

      console.log("Increase:", increase);
    }
  }
}
run();
