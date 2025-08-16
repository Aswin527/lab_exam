export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string
          name: string
          roll_number: string
          class: '9th' | '10th'
          section: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          roll_number: string
          class: '9th' | '10th'
          section: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          roll_number?: string
          class?: '9th' | '10th'
          section?: string
          created_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          title: string
          description: string
          class: '9th' | '10th'
          difficulty: 'Easy' | 'Medium' | 'Hard'
          sample_input: string | null
          sample_output: string | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          class: '9th' | '10th'
          difficulty: 'Easy' | 'Medium' | 'Hard'
          sample_input?: string | null
          sample_output?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          class?: '9th' | '10th'
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          sample_input?: string | null
          sample_output?: string | null
          created_at?: string
        }
      }
      test_cases: {
        Row: {
          id: string
          question_id: string
          input: string
          expected_output: string
          is_hidden: boolean
        }
        Insert: {
          id?: string
          question_id: string
          input: string
          expected_output: string
          is_hidden?: boolean
        }
        Update: {
          id?: string
          question_id?: string
          input?: string
          expected_output?: string
          is_hidden?: boolean
        }
      }
      mcq_questions: {
        Row: {
          id: string
          question: string
          options: Json
          correct_answer: number
          class: '9th' | '10th'
          difficulty: 'Easy' | 'Medium' | 'Hard'
          created_at: string
        }
        Insert: {
          id?: string
          question: string
          options: Json
          correct_answer: number
          class: '9th' | '10th'
          difficulty: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
        }
        Update: {
          id?: string
          question?: string
          options?: Json
          correct_answer?: number
          class?: '9th' | '10th'
          difficulty?: 'Easy' | 'Medium' | 'Hard'
          created_at?: string
        }
      }
      exam_sessions: {
        Row: {
          id: string
          student_id: string
          student_name: string
          roll_number: string
          section: string
          class: '9th' | '10th'
          start_time: string
          coding_end_time: string | null
          end_time: string | null
          current_phase: 'coding' | 'mcq' | 'completed'
          coding_score: number
          mcq_score: number
          total_score: number
          is_submitted: boolean
          answers: Json
          mcq_answers: Json
          exit_attempts: number
          created_at: string
        }
        Insert: {
          id?: string
          student_id: string
          student_name?: string
          roll_number?: string
          section?: string
          class: '9th' | '10th'
          start_time?: string
          coding_end_time?: string | null
          end_time?: string | null
          current_phase?: 'coding' | 'mcq' | 'completed'
          coding_score?: number
          mcq_score?: number
          total_score?: number
          is_submitted?: boolean
          answers?: Json
          mcq_answers?: Json
          exit_attempts?: number
          created_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          student_name?: string
          roll_number?: string
          section?: string
          class?: '9th' | '10th'
          start_time?: string
          coding_end_time?: string | null
          end_time?: string | null
          current_phase?: 'coding' | 'mcq' | 'completed'
          coding_score?: number
          mcq_score?: number
          total_score?: number
          is_submitted?: boolean
          answers?: Json
          mcq_answers?: Json
          exit_attempts?: number
          created_at?: string
        }
      }
      exam_questions: {
        Row: {
          id: string
          session_id: string
          question_id: string
          answer: string
          score: number
          passed_tests: number
          total_tests: number
        }
        Insert: {
          id?: string
          session_id: string
          question_id: string
          answer?: string
          score?: number
          passed_tests?: number
          total_tests?: number
        }
        Update: {
          id?: string
          session_id?: string
          question_id?: string
          answer?: string
          score?: number
          passed_tests?: number
          total_tests?: number
        }
      }
      exam_mcq_questions: {
        Row: {
          id: string
          session_id: string
          mcq_question_id: string
          answer: number | null
          is_correct: boolean
        }
        Insert: {
          id?: string
          session_id: string
          mcq_question_id: string
          answer?: number | null
          is_correct?: boolean
        }
        Update: {
          id?: string
          session_id?: string
          mcq_question_id?: string
          answer?: number | null
          is_correct?: boolean
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}