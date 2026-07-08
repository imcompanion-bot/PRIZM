import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');
async function test() {
  const { data: roles } = await supabase.from('roles').select('id, name').ilike('name', '%Account Director%');
  const adRole = roles.find(r => r.name === 'Account Director');
  if (!adRole) return console.log('Role not found');
  
  const { data, error } = await supabase.from('people').select('id, name, office, start_date, end_date').eq('role_id', adRole.id).limit(10);
  console.log('Account Directors:', JSON.stringify(data, null, 2));
}
test();
