import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const getExtraNum = (proj, ...keys) => {
    if (!proj) return null;
    const extra = proj.extra_data || {};
    const normalised = Object.fromEntries(Object.entries(extra).map(([k, v]) => [k.toLowerCase().trim(), v]));
    for (const k of keys) {
      const val = normalised[k.toLowerCase().trim()];
      if (val != null) {
        const n = parseFloat(String(val).replace(/[£$,%]/g, "").replace(/,/g, ""));
        if (!isNaN(n)) return n;
      }
    }
    return null;
};

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Wedding%').single();
console.log("histRate:", getExtraNum(project, "fx_rate_historical", "fx_rate"));
