/*
# Add mothers_middle_name column to pan_applications

## Purpose
The PAN application form collects mother's middle name but the column was missing from the original table.

## Changes
- Adds `mothers_middle_name` (text, nullable) to `pan_applications`.
- No security changes needed — RLS and grants already cover this table.
*/

ALTER TABLE pan_applications ADD COLUMN IF NOT EXISTS mothers_middle_name text;
