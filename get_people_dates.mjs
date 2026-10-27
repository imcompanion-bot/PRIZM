import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({path: ".env"});
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const key = 'sb_publishable_UhHtt6QptJ1ujNZpohjJfA_S8lHrwvh';
const supabase = createClient(supabaseUrl, key);

supabase.from("people").select("name, employment_start_date, employment_end_date, office").in('office', ['US', 'United States']).then(res => {
  if (res.error) console.error(res.error);
  else {
    let nullCount = 0;
    for (const r of res.data) {
       if (!r.employment_start_date) nullCount++;
    }
    console.log(`US People: ${res.data.length}, Missing Start Date: ${nullCount}`);
  }
});
