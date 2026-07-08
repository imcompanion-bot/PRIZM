import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data } = await supabase.from('people').select('name, start_date, end_date, roles(name)').in('name', ['James Silverstone', 'Ori Krispin', 'Amelia Wollaston']);
  console.log(JSON.stringify(data, null, 2));
}
test();
