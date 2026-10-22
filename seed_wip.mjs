import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function run() {
   const res = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: JSON.stringify({
        query: `
          CREATE TABLE IF NOT EXISTS project_wip_reviews (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
            dismissed_at TIMESTAMP WITH TIME ZONE,
            dismissed_by TEXT,
            dismissal_reason TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
            UNIQUE(project_id)
          );
          
          ALTER TABLE project_wip_reviews ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Allow all access to project_wip_reviews" ON project_wip_reviews;
          CREATE POLICY "Allow all access to project_wip_reviews" ON project_wip_reviews FOR ALL USING (true);
        `
      })
   });
   console.log(res.status);
   console.log(await res.text());
}
run();
