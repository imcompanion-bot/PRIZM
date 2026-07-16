const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('time_entries').select('id, date');
  if (error) {
    console.error(error);
    return;
  }
  const bad = data.filter(te => !te.date || isNaN(new Date(te.date)));
  console.log("BAD TE:", bad.length);
})();
