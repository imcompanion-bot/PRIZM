CREATE TABLE IF NOT EXISTS public.pharaoh_data (
    id TEXT PRIMARY KEY,
    payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pharaoh_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anyone to read pharaoh_data" ON public.pharaoh_data FOR SELECT USING (true);
CREATE POLICY "Allow admins to insert pharaoh_data" ON public.pharaoh_data FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admins to update pharaoh_data" ON public.pharaoh_data FOR UPDATE USING (true);
CREATE POLICY "Allow admins to delete pharaoh_data" ON public.pharaoh_data FOR DELETE USING (true);

-- Add allocated_clients to app_users
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS allocated_clients TEXT[] DEFAULT '{}'::TEXT[];

-- Update supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE pharaoh_data;
