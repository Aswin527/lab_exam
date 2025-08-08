/*
  # Python Lab Exam Database Schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `name` (text)
      - `roll_number` (text, unique)
      - `class` (text)
      - `section` (text)
      - `created_at` (timestamp)
    
    - `questions`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `class` (text)
      - `difficulty` (text)
      - `sample_input` (text)
      - `sample_output` (text)
      - `created_at` (timestamp)
    
    - `test_cases`
      - `id` (uuid, primary key)
      - `question_id` (uuid, foreign key)
      - `input` (text)
      - `expected_output` (text)
      - `is_hidden` (boolean)
    
    - `mcq_questions`
      - `id` (uuid, primary key)
      - `question` (text)
      - `options` (jsonb)
      - `correct_answer` (integer)
      - `class` (text)
      - `difficulty` (text)
      - `created_at` (timestamp)
    
    - `exam_sessions`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key)
      - `class` (text)
      - `start_time` (timestamp)
      - `coding_end_time` (timestamp)
      - `end_time` (timestamp)
      - `current_phase` (text)
      - `coding_score` (integer)
      - `mcq_score` (integer)
      - `total_score` (integer)
      - `is_submitted` (boolean)
      - `created_at` (timestamp)
    
    - `exam_questions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `question_id` (uuid, foreign key)
      - `answer` (text)
      - `score` (integer)
      - `passed_tests` (integer)
      - `total_tests` (integer)
    
    - `exam_mcq_questions`
      - `id` (uuid, primary key)
      - `session_id` (uuid, foreign key)
      - `mcq_question_id` (uuid, foreign key)
      - `answer` (integer)
      - `is_correct` (boolean)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  roll_number text UNIQUE NOT NULL,
  class text NOT NULL CHECK (class IN ('9th', '10th')),
  section text NOT NULL CHECK (section IN ('A', 'B', 'C', 'D')),
  created_at timestamptz DEFAULT now()
);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  class text NOT NULL CHECK (class IN ('9th', '10th')),
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  sample_input text DEFAULT '',
  sample_output text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create test_cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  input text NOT NULL DEFAULT '',
  expected_output text NOT NULL DEFAULT '',
  is_hidden boolean DEFAULT false
);

-- Create mcq_questions table
CREATE TABLE IF NOT EXISTS mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]',
  correct_answer integer NOT NULL DEFAULT 0,
  class text NOT NULL CHECK (class IN ('9th', '10th')),
  difficulty text NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at timestamptz DEFAULT now()
);

-- Create exam_sessions table
CREATE TABLE IF NOT EXISTS exam_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  class text NOT NULL CHECK (class IN ('9th', '10th')),
  start_time timestamptz DEFAULT now(),
  coding_end_time timestamptz,
  end_time timestamptz,
  current_phase text DEFAULT 'coding' CHECK (current_phase IN ('coding', 'mcq', 'completed')),
  coding_score integer DEFAULT 0,
  mcq_score integer DEFAULT 0,
  total_score integer DEFAULT 0,
  is_submitted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create exam_questions table (for coding questions in sessions)
CREATE TABLE IF NOT EXISTS exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES exam_sessions(id) ON DELETE CASCADE,
  question_id uuid REFERENCES questions(id) ON DELETE CASCADE,
  answer text DEFAULT '',
  score integer DEFAULT 0,
  passed_tests integer DEFAULT 0,
  total_tests integer DEFAULT 0
);

-- Create exam_mcq_questions table (for MCQ questions in sessions)
CREATE TABLE IF NOT EXISTS exam_mcq_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES exam_sessions(id) ON DELETE CASCADE,
  mcq_question_id uuid REFERENCES mcq_questions(id) ON DELETE CASCADE,
  answer integer,
  is_correct boolean DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE mcq_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_mcq_questions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is an exam system)
-- In production, you might want more restrictive policies

-- Students policies
CREATE POLICY "Allow all operations on students" ON students FOR ALL USING (true);

-- Questions policies
CREATE POLICY "Allow all operations on questions" ON questions FOR ALL USING (true);

-- Test cases policies
CREATE POLICY "Allow all operations on test_cases" ON test_cases FOR ALL USING (true);

-- MCQ questions policies
CREATE POLICY "Allow all operations on mcq_questions" ON mcq_questions FOR ALL USING (true);

-- Exam sessions policies
CREATE POLICY "Allow all operations on exam_sessions" ON exam_sessions FOR ALL USING (true);

-- Exam questions policies
CREATE POLICY "Allow all operations on exam_questions" ON exam_questions FOR ALL USING (true);

-- Exam MCQ questions policies
CREATE POLICY "Allow all operations on exam_mcq_questions" ON exam_mcq_questions FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);
CREATE INDEX IF NOT EXISTS idx_questions_class ON questions(class);
CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id);
CREATE INDEX IF NOT EXISTS idx_mcq_questions_class ON mcq_questions(class);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_student_id ON exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_questions_session_id ON exam_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_exam_mcq_questions_session_id ON exam_mcq_questions(session_id);