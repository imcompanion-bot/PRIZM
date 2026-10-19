import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const ids = [
    'ec5f2440-83c7-590c-a59a-99f5a832b782',
    'eb6dd771-e965-595f-aefd-9db290fd16ce'
  ];
  
  let allEntries = [];
  let from = 0;
  while(true) {
    const { data, error } = await supabase.from('time_entries').select('id, person_id, date, hours, project_id, notes')
      .in('person_id', ids)
      .gte('date', '2026-04-01')
      .lte('date', '2026-09-30')
      .order('id')
      .range(from, from + 999);
      
    if (error) console.error(error);
    if (!data || data.length === 0) break;
    allEntries = allEntries.concat(data);
    if (data.length < 1000) break;
    from += 1000;
  }
  
  console.log(`Fetched ${allEntries.length} total entries.`);
  
  const dupes = {};
  let dupeCount = 0;
  let duplicateHours = 0;
  for (const e of allEntries) {
    const key = `${e.date}_${e.hours}_${e.project_id}_${e.notes}`;
    if (!dupes[key]) dupes[key] = [];
    dupes[key].push(e);
  }
  
  for (const key in dupes) {
    if (dupes[key].length > 1) {
      dupeCount += (dupes[key].length - 1);
      duplicateHours += (dupes[key].length - 1) * Number(dupes[key][0].hours);
    }
  }
  
  console.log(`Found ${dupeCount} duplicated entries, totaling ${duplicateHours} hours.`);
}
run();
