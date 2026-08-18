const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function main() {
  const { data: capped, error: cErr } = await supabase.rpc('get_person_capped_hours', {
    _start_date: '2026-02-01',
    _end_date: '2026-07-30'
  });
  
  const { data: people } = await supabase.from('people').select('id, name').ilike('name', '%Oli Hodgson%');
  const oli = people[0];
  console.log('Oli ID:', oli.id);
  const oliCapped = capped.find(c => c.person_id === oli.id);
  console.log('Oli Capped:', oliCapped);
  
  const { data: util } = await supabase.rpc('get_utilisation_summary', {
    _start_date: '2026-02-01',
    _end_date: '2026-07-30'
  });
  const oliUtil = util.filter(u => u.person_id === oli.id);
  const totalLogged = oliUtil.reduce((s, u) => s + Number(u.total_hours), 0);
  const totalLeave = oliUtil.reduce((s, u) => s + Number(u.leave_hours), 0);
  console.log('Oli total logged (work):', totalLogged, 'Leave:', totalLeave);
}
main();
