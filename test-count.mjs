import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://hyfgyfuvligacjwxjnce.supabase.co',
  'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh'
);

async function test() {
  const { count } = await supabase
    .from('time_entries')
    .select('*', { count: 'exact', head: true });
  console.log('Total time entries:', count);
}

test();
