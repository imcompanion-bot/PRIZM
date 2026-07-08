import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data } = await supabase.from('people').select('name, employment_start_date, employment_end_date, overall_start_date, overall_end_date').limit(10);
  console.log(JSON.stringify(data, null, 2));
}
test();
