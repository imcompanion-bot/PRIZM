import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://obuztcdaxokvwryqgldy.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'AIzaSy...'; // I don't have the anon key hardcoded, I should use the dotenv.

async function run() {
  const { data, error } = await supabase.from('projects').select('*').ilike('title', '%talent savings%');
  console.log(data);
}
// wait I don't need to do this, let's just trigger the HTTP function!
