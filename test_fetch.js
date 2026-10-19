import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function fetchAllData(table, columns) {
  let all = [];
  let from = 0;
  const step = 1000;
  while (true) {
    const { data, error } = await supabase.from(table).select(columns).range(from, from + step - 1);
    if (error) throw error;
    all.push(...(data || []));
    if (!data || data.length < step) break;
    from += step;
  }
  return all;
}

async function run() {
  try {
    const allProjects = await fetchAllData("projects", "id, opportunity_number, title");
    console.log("Projects:", allProjects.length);
    const allPeople = await fetchAllData("people", "id, name, code, role_id, employment_start_date");
    console.log("People:", allPeople.length);
  } catch (e) {
    console.error("Fetch Error:", e);
  }
}
run();
