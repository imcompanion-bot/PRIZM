import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

const { data: project } = await supabase.from('projects').select('*').ilike('title', '%Wedding%').single();

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

let baseAgencyFeePrice = project?.price ?? project?.revenue ?? getExtraNum(project, "total price", "price gbp/usd", "price");
let baseAgencyFeeMediaCost = project?.media_cost ?? getExtraNum(project, "media cost", "cost - paid media budget") ?? 0;
let baseAgencyFeeGrossBudget = project?.gross_budget ?? project?.budget_cost ?? getExtraNum(project, "gross budget full value (gbp / usd)", "gross budget full value", "gross budget", "cost - net budget") ?? 0;

console.log("Price:", baseAgencyFeePrice);
console.log("Media Cost:", baseAgencyFeeMediaCost);
console.log("Gross Budget (budget_cost):", baseAgencyFeeGrossBudget);
