CREATE TABLE public.part_time_configs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id uuid REFERENCES public.people(id) ON DELETE CASCADE,
    days_per_week numeric NOT NULL,
    start_date date,
    end_date date,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.part_time_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.part_time_configs FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.part_time_configs FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.part_time_configs FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Enable delete access for all users" ON public.part_time_configs FOR DELETE USING (true);
