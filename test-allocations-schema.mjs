import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data, error } = await supabase.from('resource_allocations').select('*').limit(1);
  if (error) {
    console.error('Error fetching resource_allocations:', error);
  } else {
    console.log('resource_allocations data:', JSON.stringify(data, null, 2));
  }
}
test();
