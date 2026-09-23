import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

async function run() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;
  if (!url || !key) throw new Error("Missing env vars");

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const sql = `
CREATE TABLE IF NOT EXISTS public.talent_efficiencies (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    opportunity_name text,
    office text,
    efficiency_type text,
    month_date date,
    amount numeric,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT talent_efficiencies_pkey PRIMARY KEY (id)
);

ALTER TABLE public.talent_efficiencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.talent_efficiencies FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.talent_efficiencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.talent_efficiencies FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON public.talent_efficiencies FOR DELETE USING (true);
  `;

  // We can't execute raw DDL sql via supabase-js without an RPC... 
  // Let's just create the RPC first if it doesn't exist? No, we don't have superuser from the client.
  console.log("SQL to run:\n", sql);
}

run().catch(console.error);
