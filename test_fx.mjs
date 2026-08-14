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
const baseAgencyFee = baseAgencyFeePrice !== null ? baseAgencyFeePrice - baseAgencyFeeMediaCost - baseAgencyFeeGrossBudget : null;

let projAgencyFeePrice = baseAgencyFeePrice;
let projAgencyFeeMediaCost = baseAgencyFeeMediaCost;
let projAgencyFeeGrossBudget = baseAgencyFeeGrossBudget;
const ed = project?.extra_data || {};
if (ed.project_currency_revenue != null) projAgencyFeePrice = ed.project_currency_revenue;
if (ed.project_currency_media_cost != null) projAgencyFeeMediaCost = ed.project_currency_media_cost;
if (ed.project_currency_gross_budget != null) projAgencyFeeGrossBudget = ed.project_currency_gross_budget;
const projAgencyFee = projAgencyFeePrice !== null ? projAgencyFeePrice - projAgencyFeeMediaCost - projAgencyFeeGrossBudget : null;

console.log("Base Agency Fee:", baseAgencyFee);
console.log("Proj Agency Fee:", projAgencyFee);
console.log("Implicit FX Ratio:", (projAgencyFee && baseAgencyFee) ? projAgencyFee / baseAgencyFee : null);
console.log("Office:", project.office);
console.log("Active Currency (proj mode):", ed.project_currency || project.fee_calc_currency || (project.office === 'US' ? 'USD' : 'GBP'));

