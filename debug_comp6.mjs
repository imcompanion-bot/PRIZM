import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function debug() {
  const { data: people } = await supabase.from('people').select('id, name');
  const { data: utils } = await supabase.rpc('get_utilisation_summary_monthly', {
    _start_date: '2026-06-01',
    _end_date: '2026-06-30'
  });
  
  const utilsPeopleIds = new Set(utils.map(u => u.person_id));
  console.log("Total people:", people.length);
  console.log("People in utils:", utilsPeopleIds.size);
  
  let i = 0;
  for (const p of people) {
    if (!utilsPeopleIds.has(p.id)) {
      if (i++ < 5) console.log("Missing person:", p.name);
    }
  }
}
debug();
