import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data, error } = await supabase.from('projects').select('id, title, office, ultimate_parent').ilike('ultimate_parent', '%IKEA%').limit(10);
  console.log('IKEA Projects:', JSON.stringify(data, null, 2));
}
test();
