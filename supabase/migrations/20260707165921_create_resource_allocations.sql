CREATE TABLE public.resource_allocations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    client_name text NOT NULL,
    person_id uuid NOT NULL REFERENCES public.people(id),
    role_id uuid NOT NULL REFERENCES public.roles(id),
    start_date date NOT NULL,
    end_date date NOT NULL,
    allocation_percentage numeric NOT NULL DEFAULT 100,
    created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT resource_allocations_pkey PRIMARY KEY (id)
);

ALTER TABLE public.resource_allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all access for all users" ON public.resource_allocations FOR ALL USING (true) WITH CHECK (true);
