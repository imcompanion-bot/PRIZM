import fetch from 'node-fetch';

const WORKING_HOURS_PER_YEAR = 1665;
const HOURS_PER_DAY = 7.5;

function calculateInternalCostPerHour(annualSalary, billableCapacityHours) {
  const weeklyCapacity = (billableCapacityHours == null || billableCapacityHours <= 0) ? (HOURS_PER_DAY * 5) : billableCapacityHours;
  const dailyBillableHours = weeklyCapacity / 5;
  const billableCapacityPct = dailyBillableHours / HOURS_PER_DAY;
  const billableHoursPerYear = WORKING_HOURS_PER_YEAR * billableCapacityPct;
  return annualSalary / billableHoursPerYear;
}

(async () => {
  // Hardcoded dates for Microsoft - Surface project
  const startDate = "2023-11-01"; 
  const endDate = "2024-04-30";
  
  const resp = await fetch(`https://api.frankfurter.app/${startDate}..${endDate}?base=GBP&symbols=USD`);
  const data = await resp.json();
  let sum = 0, count = 0;
  for (const [date, currencies] of Object.entries(data.rates || {})) {
    const usd = currencies.USD;
    if (usd) { sum += usd; count++; }
  }
  const historicalFxRate = count > 0 ? sum / count : 1.25;
  console.log("Live API Project histRate (Frankfurter):", historicalFxRate);

  const fxRateGbp = historicalFxRate;

  const c1 = calculateInternalCostPerHour(228545.7, 11.25);
  const c2 = calculateInternalCostPerHour(208061.7, 11.25);

  console.log("Record 1 (salary 228545.7, cap 11.25)");
  console.log("  GBP Cost / Hr: £" + c1.toFixed(2));
  console.log("  USD Cost / Hr: $" + (c1 * fxRateGbp).toFixed(2));

  console.log("Record 2 (salary 208061.7, cap 11.25)");
  console.log("  GBP Cost / Hr: £" + c2.toFixed(2));
  console.log("  USD Cost / Hr: $" + (c2 * fxRateGbp).toFixed(2));
})();
