import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('projects').select('opportunity_record_type');
  const counts = {};
  for (const d of data) {
    counts[d.opportunity_record_type] = (counts[d.opportunity_record_type] || 0) + 1;
  }
  console.log(counts);
}

run();
