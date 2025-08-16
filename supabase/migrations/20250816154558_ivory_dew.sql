/*
  # Add missing columns to exam_sessions table

  1. New Columns
    - `student_name` (text) - stores student name for quick access
    - `roll_number` (text) - stores student roll number
    - `section` (text) - stores student section
    - `answers` (jsonb) - stores coding question answers
    - `mcq_answers` (jsonb) - stores MCQ answers
    - `exit_attempts` (integer) - tracks security violations

  2. Updates
    - Add default values for new columns
    - Ensure backward compatibility
*/

-- Add missing columns to exam_sessions table
DO $$
BEGIN
  -- Add student_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'student_name'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN student_name text DEFAULT '';
  END IF;

  -- Add roll_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'roll_number'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN roll_number text DEFAULT '';
  END IF;

  -- Add section column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'section'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN section text DEFAULT '';
  END IF;

  -- Add answers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'answers'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN answers jsonb DEFAULT '{}';
  END IF;

  -- Add mcq_answers column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'mcq_answers'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN mcq_answers jsonb DEFAULT '{}';
  END IF;

  -- Add exit_attempts column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'exam_sessions' AND column_name = 'exit_attempts'
  ) THEN
    ALTER TABLE exam_sessions ADD COLUMN exit_attempts integer DEFAULT 0;
  END IF;
END $$;