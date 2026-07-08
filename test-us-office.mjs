import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data, error } = await supabase.from('projects').select('office').limit(50);
  const uniqueOffices = [...new Set(data.map(d => d.office))];
  console.log('Unique Offices:', uniqueOffices);
}
test();
