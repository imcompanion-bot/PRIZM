CREATE OR REPLACE FUNCTION public.get_person_capped_hours(_start_date date, _end_date date)
RETURNS TABLE(person_id uuid, capped_hours numeric)
LANGUAGE sql
STABLE
SET search_path TO 'public'
AS $$
  SELECT 
    daily.person_id,
    SUM(LEAST(daily.daily_hours, 7.5)) AS capped_hours
  FROM (
    SELECT 
      person_id, 
      date, 
      SUM(hours) AS daily_hours
    FROM time_entries
    WHERE date >= _start_date AND date <= _end_date
    GROUP BY person_id, date
  ) daily
  GROUP BY daily.person_id;
$$;
