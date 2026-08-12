CREATE OR REPLACE FUNCTION public.get_project_person_hours_windowed(_start_date date, _end_date date)
RETURNS TABLE(project_id uuid, person_id uuid, total_hours numeric)
LANGUAGE sql
STABLE
SET statement_timeout = '60s'
AS $$
  WITH person_day AS (
    SELECT te.person_id, te.date, SUM(te.hours) AS h
    FROM time_entries te
    WHERE te.person_id IS NOT NULL
      AND te.date >= _start_date AND te.date <= _end_date
    GROUP BY te.person_id, te.date
  ),
  project_person AS (
    SELECT DISTINCT te.project_id, te.person_id
    FROM time_entries te
    JOIN projects p ON te.project_id = p.id
    WHERE te.project_id IS NOT NULL AND te.person_id IS NOT NULL
      AND (p.end_date >= _start_date OR p.end_date IS NULL)
      AND (p.start_date <= _end_date OR p.start_date IS NULL)
  )
  SELECT pp.project_id, pp.person_id, COALESCE(SUM(pd.h), 0)::numeric AS total_hours
  FROM project_person pp
  LEFT JOIN person_day pd ON pp.person_id = pd.person_id
  GROUP BY pp.project_id, pp.person_id;
$$;
