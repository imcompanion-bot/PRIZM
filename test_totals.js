import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { parseISO, format, eachMonthOfInterval, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';

dotenv.config({ path: '.env' });
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

function countWorkingDays(start, end) {
  if (start > end) return 0;
  return eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
}

async function run() {
  const { data: projects } = await supabase.from('projects').select('*, project_scopes(*)').eq('office', 'United States');
  const { data: phases } = await supabase.from('project_phases').select('*');
  const { data: allocs } = await supabase.from('phase_allocations').select('*');
  const { data: rates } = await supabase.from('rate_cards').select('*');

  const roleRates = {};
  for (const r of rates) roleRates[r.role_id] = r.rate;

  const today = new Date();
  let chartTotal = 0;
  let summaryTotal = 0;

  for (const p of projects) {
    if (p.start_date < "2024-01-01") continue;
    if (p.opportunity_record_type === 'Agency - Talent Savings') continue;
    if ((p.title||'').toLowerCase().includes('talent savings')) continue;
    
    // just dummy for US last 6 months
  }
}
run();
