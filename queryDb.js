require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('projects').select('id, title, start_date, end_date').ilike('title', '%Degree 2026%Always%');
  console.log(data);
}
run();
