const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env', 'utf-8');
const supabaseUrl = env.match(/VITE_SUPABASE_URL="(.*)"/)[1];
const supabaseKey = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="(.*)"/)[1];
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase.from('projects').select('id, title, fx_lock_date');
  if (error) {
    console.error(error);
    return;
  }
  const bad = data.filter(p => p.fx_lock_date && isNaN(new Date(p.fx_lock_date)));
  console.log("BAD FX PROJECTS:", bad);
})();
