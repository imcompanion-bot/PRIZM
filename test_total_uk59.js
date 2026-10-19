// Their sum is 27,793.41
// My script got 26,098.45
// 27,793.41 - 26,098.45 = 1,694.96 difference.
// Looking at their list, they have "Unilever - Hellmann's Sandwich & BBQ 2025" TWICE!
// Once for 3735, once for 2061.395349.
// Why did they list it twice? 3735 + 2061.39 = 5796.39
// Wait, my DB has: Unilever - Hellmann's Sandwich & BBQ 2025 25/26: 5796.3953489
// So my DB matches their TWO rows COMBINED!
// Let's check Dove US Pilot. In their list it's 1856.79. My script earlier got 1856.81. Close enough.
// Wait! Is "Dove US Pilot" an OFFICE = UK project? Let's check.
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const { data } = await supabase.from('projects').select('title, office').ilike('title', "%Dove US Pilot%");
  console.log(data);
}
run();
