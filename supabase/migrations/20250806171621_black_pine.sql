/*
  # Add exit_attempts column to exam_sessions table

  1. Changes
    - Add `exit_attempts` column to `exam_sessions` table
    - Set default value to 0
    - Update existing records to have 0 exit attempts

  2. Security
    - No changes to RLS policies needed
*/

-- Add exit_attempts column to exam_sessions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'exit_attempts'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN exit_attempts integer DEFAULT 0 NOT NULL;
  END IF;
END $$;

-- Update existing records to have 0 exit attempts if they don't have a value
UPDATE exam_sessions SET exit_attempts = 0 WHERE exit_attempts IS NULL;