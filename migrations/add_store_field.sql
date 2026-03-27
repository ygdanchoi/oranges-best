-- Add store field to oranges table
ALTER TABLE oranges ADD COLUMN IF NOT EXISTS store VARCHAR(100);
