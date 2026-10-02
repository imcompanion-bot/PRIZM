import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function debug() {
  const { data: utilisation, error } = await supabase.rpc('get_utilisation_summary_monthly', {
    _start_date: '2026-04-01',
    _end_date: '2026-09-30'
  });
  console.log("Total rows:", utilisation?.length, error);
  const us = utilisation.filter(u => u.month_date === '2026-06-01');
  console.log("Total rows in June:", us.length);
}
debug();
