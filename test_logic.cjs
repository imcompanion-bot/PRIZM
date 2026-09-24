const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, eachDayOfInterval, isWeekend } = require('date-fns');

dotenv.config({ path: '.env' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

function getWorkingDays(start, end) {
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
}

async function run() {
  const cutoffDate = "2026-07-01";
  const endDateStr = "2026-07-31";
  
  const { data: projects } = await supabase.from('projects').select('*, project_scopes(*)').eq('office', 'United States');
  const { data: phases } = await supabase.from('project_phases').select('*');
  const { data: allocs } = await supabase.from('phase_allocations').select('*');
  const { data: rates } = await supabase.from('rate_cards').select('*');
  
  const roleRates = {};
  for (const r of rates) roleRates[r.role_id] = r.rate;
  
  let pageTotal = 0;
  let chartTotal = 0;

  for (const p of projects) {
    if (p.start_date < "2024-01-01") continue;
    if (p.end_date < cutoffDate || p.start_date > endDateStr) continue;
    
    // Simplification for Agency Fee
    const price = p.price || p.revenue || 0;
    const mc = p.media_cost || 0;
    const gb = p.gross_budget || 0;
    const fullAgencyFee = price - mc - gb;
    
    const rateCardRev = (p.project_scopes || []).reduce((s, sc) => s + (sc.scoped_hours||0)*(roleRates[sc.role_id]||0), 0);
    const agencyFee = fullAgencyFee > 0 ? fullAgencyFee : rateCardRev;
    if (agencyFee <= 0) continue;
    
    // chart logic
    const monthlyRevenue = {};
    const pPhases = phases.filter(ph => ph.project_id === p.id);
    const pPhaseIds = new Set(pPhases.map(ph => ph.id));
    const pAllocs = allocs.filter(a => pPhaseIds.has(a.phase_id));
    
    let totalAlloc = 0;
    for (const pa of pAllocs) {
      const scope = (p.project_scopes||[]).find(sc => sc.id === pa.project_scope_id);
      const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
      totalAlloc += Number(pa.hours) * rate;
    }
    
    if (pPhases.length > 0 && pAllocs.length > 0 && totalAlloc > 0) {
      for (const ph of pPhases) {
        if (!ph.start_date || !ph.end_date) continue;
        const pStart = parseISO(ph.start_date);
        const pEnd = parseISO(ph.end_date);
        
        const phaseValue = pAllocs.filter(pa => pa.phase_id === ph.id).reduce((s, pa) => {
          const scope = (p.project_scopes||[]).find(sc => sc.id === pa.project_scope_id);
          const rate = scope ? (roleRates[scope.role_id] || 0) : 0;
          return s + Number(pa.hours) * rate;
        }, 0);
        
        const phaseFee = agencyFee * (phaseValue / totalAlloc);
        if (phaseFee <= 0) continue;
        
        const totalDays = getWorkingDays(pStart, pEnd);
        if (totalDays === 0) continue;
        
        const pMonths = eachMonthOfInterval({ start: startOfMonth(pStart), end: startOfMonth(pEnd) });
        for (const m of pMonths) {
          const mEnd = endOfMonth(m);
          const oStart = m < pStart ? pStart : m;
          const oEnd = mEnd > pEnd ? pEnd : mEnd;
          const oDays = getWorkingDays(oStart, oEnd);
          const mk = format(m, "yyyy-MM-01");
          monthlyRevenue[mk] = (monthlyRevenue[mk] || 0) + phaseFee * (oDays / totalDays);
        }
      }
    } else {
      const pStart = parseISO(p.start_date);
      const pEnd = parseISO(p.end_date);
      const totalDays = getWorkingDays(pStart, pEnd);
      if (totalDays > 0) {
        const pMonths = eachMonthOfInterval({ start: startOfMonth(pStart), end: startOfMonth(pEnd) });
        for (const m of pMonths) {
          const mEnd = endOfMonth(m);
          const oStart = m < pStart ? pStart : m;
          const oEnd = mEnd > pEnd ? pEnd : mEnd;
          const oDays = getWorkingDays(oStart, oEnd);
          const mk = format(m, "yyyy-MM-01");
          monthlyRevenue[mk] = (monthlyRevenue[mk] || 0) + agencyFee * (oDays / totalDays);
        }
      }
    }
    
    chartTotal += monthlyRevenue["2026-07-01"] || 0;
  }
  
  console.log("Chart Total for July:", chartTotal);
}
run();
