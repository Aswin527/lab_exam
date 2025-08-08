export interface Question {
  id: string;
  title: string;
  description: string;
  class: '9th' | '10th';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  testCases: TestCase[];
  sampleInput?: string;
  sampleOutput?: string;
  createdAt: Date;
}

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  class: '9th' | '10th';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  rollNumber: string;
  class: '8th' | '9th' | '10th';
  section: string;
  createdAt: Date;
}

export interface ClassSection {
  class: '8th' | '9th' | '10th';
  section: string;
  accessCode: string;
  duration: number; // in minutes
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ExamSession {
  id: string;
  studentId: string;
  student: Student;
  class: '9th' | '10th';
  questions: Question[];
  mcqQuestions: MCQQuestion[];
  answers: { [questionId: string]: string };
  mcqAnswers: { [questionId: string]: number };
  results: { [questionId: string]: EvaluationResult };
  mcqResults: { [questionId: string]: boolean };
  startTime: Date;
  codingEndTime?: Date;
  endTime?: Date;
  isSubmitted: boolean;
  currentPhase: 'coding' | 'mcq' | 'completed';
  codingScore: number;
  mcqScore: number;
  totalScore: number;
  exitAttempts: number;
}

export interface EvaluationResult {
  questionId: string;
  code: string;
  testResults: TestResult[];
  score: number;
  totalTests: number;
  passedTests: number;
  executionTime: number;
  hasError: boolean;
  errorMessage?: string;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  error?: string;
}