import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabaseUrl = process.env.VITE_SUPABASE_URL;

import fs from 'fs';
const seedContent = fs.readFileSync('seed_wip.mjs', 'utf8');
const match = seedContent.match(/sb_publishable_[a-zA-Z0-9_]+/);
const supabaseKey = match ? match[0] : process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// Wait, the seed_wip.mjs says process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh' inside debug_comp.mjs
const key = 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh';

const supabase = createClient(supabaseUrl, key);
supabase.from("talent_efficiencies").select("month_date, amount, office").in('office', ['US', 'United States']).then(res => {
  if (res.error) console.error(res.error);
  else {
    const byMonth = {};
    for (const r of res.data) {
       byMonth[r.month_date] = (byMonth[r.month_date] || 0) + r.amount;
    }
    console.log(byMonth);
  }
});
