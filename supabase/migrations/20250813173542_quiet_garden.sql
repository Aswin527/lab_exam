@@ .. @@
 CREATE TABLE IF NOT EXISTS exam_sessions (
   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
   student_id uuid REFERENCES students(id) ON DELETE CASCADE,
+  student_name text DEFAULT '',
+  roll_number text DEFAULT '',
+  section text DEFAULT '',
   class text NOT NULL CHECK (class IN ('9th', '10th')),
   start_time timestamptz DEFAULT now(),
   coding_end_time timestamptz,
   end_time timestamptz,
   current_phase text DEFAULT 'coding' CHECK (current_phase IN ('coding', 'mcq', 'completed')),
   coding_score integer DEFAULT 0,
   mcq_score integer DEFAULT 0,
   total_score integer DEFAULT 0,
   is_submitted boolean DEFAULT false,
+  answers jsonb DEFAULT '{}',
+  mcq_answers jsonb DEFAULT '{}',
+  exit_attempts integer DEFAULT 0,
   created_at timestamptz DEFAULT now()
 );