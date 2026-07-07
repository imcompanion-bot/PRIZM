import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data, error } = await supabase.from('project_scopes').select('*').limit(1);
  console.log('Scopes:', JSON.stringify(data, null, 2));
}
test();
