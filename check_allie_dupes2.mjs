import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    'ec5f2440-83c7-590c-a59a-99f5a832b782', // Allie Edmonds
    'eb6dd771-e965-595f-aefd-9db290fd16ce'  // Allie Edmonds
  ];
  
  let allEntries = [];
  let from = 0;
  while(true) {
    const { data, error } = await supabase.from('time_entries').select('*')
      .in('person_id', ids)
      .gte('date', '2026-09-01')
      .lte('date', '2026-09-30')
      .range(from, from + 999);
      
    if (error) console.error(error);
    if (!data || data.length === 0) break;
    allEntries = allEntries.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  
  console.log(`Fetched ${allEntries.length} total entries.`);
  if (allEntries.length > 0) {
     console.log("Sample entries:");
     console.table(allEntries.slice(0, 5));
  }
}
run();
