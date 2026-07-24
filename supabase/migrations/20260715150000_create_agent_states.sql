-- Migration: Create agent_states table and seed default agents
-- Path: supabase/migrations/20260715150000_create_agent_states.sql

CREATE TABLE IF NOT EXISTS public.agent_states (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'live', -- 'live', 'stopped', 'failed'
    last_run_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    success_rate NUMERIC(5,2) DEFAULT 100.00,
    error_message TEXT,
    restarted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.agent_states ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users read and write access
-- Since users are allowed to restart and configure agents as per requirement
CREATE POLICY "Allow authenticated users all operations" 
ON public.agent_states 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Also allow anon for local development and testing convenience if needed
CREATE POLICY "Allow anon users all operations" 
ON public.agent_states 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Seed initial agents with status data
INSERT INTO public.agent_states (id, name, status, last_run_at, success_rate, error_message)
VALUES 
('margin_sentry', 'Margin Sentry', 'live', NOW() - INTERVAL '12 minutes', 99.80, NULL),
('bench_optimiser', 'Capacity & Bench Cost Optimiser', 'live', NOW() - INTERVAL '45 minutes', 98.50, NULL),
('rate_card_guardian', 'Pricing Integrity & ARR Guardian', 'live', NOW() - INTERVAL '1 hour', 100.00, NULL),
('revenue_runway', 'Revenue Runway & Forecast Adjuster', 'failed', NOW() - INTERVAL '3 hours', 92.10, 'Connection timeout: Failed to connect to Sales CRM API endpoint (DNS resolution error).'),
('velocity_guard', 'Working Capital & Timesheet Velocity Accelerator', 'stopped', NOW() - INTERVAL '1 day', 100.00, 'Agent stopped manually by administrator.')
ON CONFLICT (id) DO UPDATE 
SET 
    status = EXCLUDED.status,
    last_run_at = EXCLUDED.last_run_at,
    success_rate = EXCLUDED.success_rate,
    error_message = EXCLUDED.error_message;
