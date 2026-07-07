import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data, error } = await supabase.from('people').select('*').limit(1);
  console.log('Data:', data);
  console.log('Error:', error);
}
test();
