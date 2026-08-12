import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);
async function run() {
  const pId = '8ce706b8-31f2-5b05-9439-598600c51927';
  const { data, error } = await supabase
    .from('time_entries')
    .update({ project_id: pId })
    .is('project_id', null)
    .ilike('project_name', '%Degree 2027%');
  console.log('Update result:', data, 'error:', error);
}
run();
