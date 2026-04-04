-- Remove is_provisional column from characters table
-- This flag was only used for display purposes and is no longer needed
ALTER TABLE characters DROP COLUMN IF EXISTS is_provisional;
