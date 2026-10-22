Please copy and paste the following SQL block into the Supabase SQL Editor to create the necessary table for the WIP comments:

```sql
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
```
