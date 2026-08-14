import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Microsoft%Surface%One Surface Creator Strategy%').single();
const { data: person } = await supabase.from('people').select('*, roles(billable_capacity_hours)').ilike('name', '%Simon Harwood%').single();

console.log("Project:", project?.title);
console.log("Project Extra Data:", project?.extra_data);
console.log("Project fee_calc_currency:", project?.fee_calc_currency);
console.log("Project fx_rate_gbp:", project?.fx_rate_gbp);
console.log("Project fx_rate_usd:", project?.fx_rate_usd);
console.log("Person:", person?.name);
console.log("Person Office:", person?.office);
console.log("Person Salary:", person?.annual_salary);
console.log("Person Capacity:", person?.roles?.billable_capacity_hours);
