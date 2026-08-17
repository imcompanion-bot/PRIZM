import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient('https://hyfgyfuvligacjwxjnce.supabase.co', 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh');

async function main() {
  const { data: proj } = await supabase.from('projects').select('id, title, start_date, end_date').eq('id', '4374255d-4343-57d0-b641-f85a66839e37').single();
  console.log('Project:', proj);
}
main();
