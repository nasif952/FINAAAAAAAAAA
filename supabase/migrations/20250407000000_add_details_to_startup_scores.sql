-- Add the 'details' column to the startup_scores table to store score details as JSON
ALTER TABLE IF EXISTS public.startup_scores
ADD COLUMN IF NOT EXISTS details JSONB;

-- Comment on the column to document its purpose
COMMENT ON COLUMN public.startup_scores.details IS 'JSON data containing detailed score metrics and calculations'; 