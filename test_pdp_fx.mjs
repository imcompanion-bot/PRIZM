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

let officeCurrency = project.office === 'US' || project.office === 'United States' ? 'USD' : 'GBP';
let activeCurrency = 'USD'; // Based on previous test

const histRate = 1.25;

const convertCostToActiveCurrency = (costInLocalCurrency, office) => {
    // If currencyMode === "project", implicitFxRatio = 1
    // officeCurrency = USD
    const personIsUs = office === "US" || office === "United States";
    let costInOfficeCurrency = costInLocalCurrency;
    
    // Normalize cost back to the office's base currency using the standard system FX rate
    if (officeCurrency === "GBP") {
      if (personIsUs) costInOfficeCurrency = costInLocalCurrency / histRate;
    } else if (officeCurrency === "USD") {
      if (!personIsUs) costInOfficeCurrency = costInLocalCurrency * histRate;
    }
    
    // implicitFxRatio is 1
    return costInOfficeCurrency * 1;
};

let totalCost = 0;
let totalHours = 0;

timeEntries.forEach(te => {
    totalHours += te.hours;
    const salary = te.people?.annual_salary;
    const team = te.people?.team;
    const isBillableTeam = team && BILLABLE_TEAMS.has(team.toLowerCase());
    const cap = isBillableTeam ? te.people?.roles?.billable_capacity_hours : null;
    if (!salary) return;
    const costPerHour = calculateInternalCostPerHour(salary, cap);
    const office = te.people?.office || "UK";
    
    const fxCost = convertCostToActiveCurrency(costPerHour, office);
    totalCost += te.hours * fxCost;
    
    // console.log(te.people.name, te.hours, office, "baseCost/hr:", costPerHour, "fxCost/hr:", fxCost);
});

console.log("Total Actual Cost with FX:", totalCost);
