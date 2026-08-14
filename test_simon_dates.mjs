import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('title, start_date, end_date').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();
console.log("Project:", project.title);
console.log("Start Date:", project.start_date);
console.log("End Date:", project.end_date);

const startDate = project.start_date;
const endDate = project.end_date;

const resp = await fetch(`https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=GBP&symbols=USD`);
const data = await resp.json();
let sum = 0, count = 0;
for (const [date, currencies] of Object.entries(data.rates || {})) {
  const usd = currencies.USD;
  if (usd) { sum += usd; count++; }
}
const historicalFxRate = count > 0 ? sum / count : 1.25;
console.log("Historical API FX Rate:", historicalFxRate.toFixed(4));
