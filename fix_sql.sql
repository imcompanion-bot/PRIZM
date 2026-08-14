CREATE OR REPLACE FUNCTION public.get_project_costs_monthly(
  _start_date date DEFAULT NULL,
  _end_date date DEFAULT NULL
)
RETURNS TABLE (
  project_id uuid,
  month_date date,
  total_hours numeric,
  cost_gbp_staff numeric,
  cost_usd_staff numeric
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    te.project_id,
    DATE_TRUNC('month', te.date)::date AS month_date,
    SUM(te.hours) AS total_hours,
    SUM(
      CASE
        WHEN p.annual_salary IS NOT NULL AND p.annual_salary > 0
             AND (p.office = 'UK' OR p.office = 'United Kingdom' OR p.office IS NULL) THEN
          te.hours * (
            (p.annual_salary * 1.15) /
            NULLIF(1665.0 * (
              COALESCE(
                NULLIF(r.billable_capacity_hours, 0) / 5.0,
                7.5
              ) / 7.5
            ), 0)
          )
        ELSE 0
      END
    ) AS cost_gbp_staff,
    SUM(
      CASE
        WHEN p.annual_salary IS NOT NULL AND p.annual_salary > 0
             AND (p.office = 'US' OR p.office = 'United States') THEN
          te.hours * (
            (p.annual_salary * 1.15) /
            NULLIF(1665.0 * (
              COALESCE(
                NULLIF(r.billable_capacity_hours, 0) / 5.0,
                7.5
              ) / 7.5
            ), 0)
          )
        ELSE 0
      END
    ) AS cost_usd_staff
  FROM time_entries te
  LEFT JOIN people p ON p.id = te.person_id
  LEFT JOIN roles r ON r.id = p.role_id
  WHERE (_start_date IS NULL OR te.date >= _start_date)
    AND (_end_date IS NULL OR te.date <= _end_date)
  GROUP BY te.project_id, DATE_TRUNC('month', te.date)::date;
$$;
