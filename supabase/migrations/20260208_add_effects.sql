-- Add point_collection_effect and redemption_effect columns to branches table
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS point_collection_effect text DEFAULT 'shower',
ADD COLUMN IF NOT EXISTS redemption_effect text DEFAULT 'confetti';

-- Update existing rows to have default values if they are null (though default handles new inserts)
UPDATE branches SET point_collection_effect = 'shower' WHERE point_collection_effect IS NULL;
UPDATE branches SET redemption_effect = 'confetti' WHERE redemption_effect IS NULL;
