import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyfgyfuvligacjwxjnce.supabase.co';
const supabaseKey = 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('app_users').select('*');
  if (error) console.error(error);
  else console.log('Users in DB:', data);
}

main();
