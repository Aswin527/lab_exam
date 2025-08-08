import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Question, MCQQuestion, Student, ExamSession, EvaluationResult, TestResult, ClassSection } from '../types/Question';

// Access codes for each class section
const CLASS_SECTIONS: ClassSection[] = [
  // 8th Grade - 40 minutes
  { class: '8th', section: 'A', accessCode: 'KNCS8A2025', duration: 40 },
  { class: '8th', section: 'B', accessCode: 'KNCS8B2025', duration: 40 },
  { class: '8th', section: 'C', accessCode: 'KNCS8C2025', duration: 40 },
  { class: '8th', section: 'D', accessCode: 'KNCS8D2025', duration: 40 },
  
  // 9th Grade - 90 minutes
  { class: '9th', section: 'A', accessCode: 'KNCS9A2025', duration: 90 },
  { class: '9th', section: 'B', accessCode: 'KNCS9B2025', duration: 90 },
  { class: '9th', section: 'C', accessCode: 'KNCS9C2025', duration: 90 },
  { class: '9th', section: 'D', accessCode: 'KNCS9D2025', duration: 90 },
  
  // 10th Grade - 90 minutes
  { class: '10th', section: 'A', accessCode: 'KNCS10A2025', duration: 90 },
  { class: '10th', section: 'B', accessCode: 'KNCS10B2025', duration: 90 },
  { class: '10th', section: 'C', accessCode: 'KNCS10C2025', duration: 90 },
  { class: '10th', section: 'D', accessCode: 'KNCS10D2025', duration: 90 },
];

interface ExamContextType {
  // Questions Management
  questions: Question[];
  addQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  getQuestionsByClass: (className: '9th' | '10th') => Question[];
  
  // MCQ Questions Management
  mcqQuestions: MCQQuestion[];
  addMCQQuestion: (question: Omit<MCQQuestion, 'id' | 'createdAt'>) => void;
  updateMCQQuestion: (id: string, question: Partial<MCQQuestion>) => void;
  deleteMCQQuestion: (id: string) => void;
  getMCQQuestionsByClass: (className: '9th' | '10th') => MCQQuestion[];
  
  // Student Management
  students: Student[];
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void;
  updateStudent: (id: string, student: Partial<Student>) => void;
  deleteStudent: (id: string) => void;
  getStudentsByClass: (className: '9th' | '10th') => Student[];
  
  // Exam Sessions
  currentSession: ExamSession | null;
  startExam: (studentId: string, accessCode: string) => Promise<boolean>;
  submitAnswer: (questionId: string, code: string) => void;
  submitMCQAnswer: (questionId: string, answer: number) => void;
  submitCodingSection: () => void;
  submitMCQSection: () => void;
  evaluateCode: (questionId: string, code: string) => Promise<EvaluationResult>;
  
  // Admin
  examSessions: ExamSession[];
  classSections: ClassSection[];
  validateAccessCode: (className: '8th' | '9th' | '10th', section: string, accessCode: string) => boolean;
  getExamDuration: (className: '8th' | '9th' | '10th') => number;
  updateExitAttempts: (increment: number) => void;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  updateAccessCode: (className: '8th' | '9th' | '10th', section: string, newAccessCode: string) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

// Sample questions for demonstration
const sampleQuestions: Question[] = [
  {
    id: '1',
    title: 'Sum of Two Numbers',
    description: 'Write a Python program that takes two numbers as input and prints their sum.',
    class: '9th',
    difficulty: 'Easy',
    sampleInput: '5\n3',
    sampleOutput: '8',
    testCases: [
      { id: '1', input: '5\n3', expectedOutput: '8', isHidden: false },
      { id: '2', input: '10\n20', expectedOutput: '30', isHidden: true },
      { id: '3', input: '-5\n5', expectedOutput: '0', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '2',
    title: 'Even or Odd',
    description: 'Write a Python program that checks if a given number is even or odd.',
    class: '9th',
    difficulty: 'Easy',
    sampleInput: '4',
    sampleOutput: 'Even',
    testCases: [
      { id: '1', input: '4', expectedOutput: 'Even', isHidden: false },
      { id: '2', input: '7', expectedOutput: 'Odd', isHidden: true },
      { id: '3', input: '0', expectedOutput: 'Even', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '3',
    title: 'Factorial Calculator',
    description: 'Write a Python program to calculate the factorial of a given number.',
    class: '10th',
    difficulty: 'Medium',
    sampleInput: '5',
    sampleOutput: '120',
    testCases: [
      { id: '1', input: '5', expectedOutput: '120', isHidden: false },
      { id: '2', input: '0', expectedOutput: '1', isHidden: true },
      { id: '3', input: '3', expectedOutput: '6', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '4',
    title: 'Prime Number Check',
    description: 'Write a Python program to check if a given number is prime.',
    class: '10th',
    difficulty: 'Medium',
    sampleInput: '17',
    sampleOutput: 'Prime',
    testCases: [
      { id: '1', input: '17', expectedOutput: 'Prime', isHidden: false },
      { id: '2', input: '4', expectedOutput: 'Not Prime', isHidden: true },
      { id: '3', input: '2', expectedOutput: 'Prime', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '5',
    title: 'List Maximum',
    description: 'Write a Python program to find the maximum number in a list.',
    class: '9th',
    difficulty: 'Medium',
    sampleInput: '1 5 3 9 2',
    sampleOutput: '9',
    testCases: [
      { id: '1', input: '1 5 3 9 2', expectedOutput: '9', isHidden: false },
      { id: '2', input: '10 20 5', expectedOutput: '20', isHidden: true },
      { id: '3', input: '-1 -5 -2', expectedOutput: '-1', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '6',
    title: 'Average of Three Subjects',
    description: 'Write a Python program that takes marks of three subjects as input and calculates their average. Display the average rounded to 2 decimal places.',
    class: '9th',
    difficulty: 'Easy',
    sampleInput: '85\n90\n78',
    sampleOutput: '84.33',
    testCases: [
      { id: '1', input: '85\n90\n78', expectedOutput: '84.33', isHidden: false },
      { id: '2', input: '100\n95\n88', expectedOutput: '94.33', isHidden: true },
      { id: '3', input: '70\n80\n90', expectedOutput: '80.00', isHidden: true },
      { id: '4', input: '0\n50\n100', expectedOutput: '50.00', isHidden: true }
    ],
    createdAt: new Date()
  },
  {
    id: '7',
    title: 'String Reversal',
    description: 'Write a Python program to reverse a given string.',
    class: '10th',
    difficulty: 'Easy',
    sampleInput: 'hello',
    sampleOutput: 'olleh',
    testCases: [
      { id: '1', input: 'hello', expectedOutput: 'olleh', isHidden: false },
      { id: '2', input: 'python', expectedOutput: 'nohtyp', isHidden: true },
      { id: '3', input: 'a', expectedOutput: 'a', isHidden: true }
    ],
    createdAt: new Date()
  }
];

// Sample MCQ questions
const sampleMCQQuestions: MCQQuestion[] = [
  {
    id: '1',
    question: 'What is the correct way to create a list in Python?',
    options: ['list = []', 'list = ()', 'list = {}', 'list = ""'],
    correctAnswer: 0,
    class: '9th',
    difficulty: 'Easy',
    createdAt: new Date()
  },
  {
    id: '2',
    question: 'Which of the following is used to add an element to a list?',
    options: ['add()', 'append()', 'insert()', 'push()'],
    correctAnswer: 1,
    class: '9th',
    difficulty: 'Easy',
    createdAt: new Date()
  },
  {
    id: '3',
    question: 'What does the len() function return?',
    options: ['The last element', 'The first element', 'The length of the object', 'The type of object'],
    correctAnswer: 2,
    class: '9th',
    difficulty: 'Easy',
    createdAt: new Date()
  },
  {
    id: '4',
    question: 'Which loop is used when the number of iterations is known?',
    options: ['while loop', 'for loop', 'do-while loop', 'infinite loop'],
    correctAnswer: 1,
    class: '10th',
    difficulty: 'Medium',
    createdAt: new Date()
  },
  {
    id: '5',
    question: 'What is the output of print(2 ** 3)?',
    options: ['6', '8', '9', '5'],
    correctAnswer: 1,
    class: '10th',
    difficulty: 'Easy',
    createdAt: new Date()
  },
  {
    id: '6',
    question: 'Which method is used to remove whitespace from both ends of a string?',
    options: ['strip()', 'trim()', 'clean()', 'remove()'],
    correctAnswer: 0,
    class: '10th',
    difficulty: 'Medium',
    createdAt: new Date()
  },
  {
    id: '7',
    question: 'What is the correct syntax for a function in Python?',
    options: ['function myFunc():', 'def myFunc():', 'create myFunc():', 'func myFunc():'],
    correctAnswer: 1,
    class: '9th',
    difficulty: 'Medium',
    createdAt: new Date()
  },
  {
    id: '8',
    question: 'Which of the following is a mutable data type?',
    options: ['tuple', 'string', 'list', 'integer'],
    correctAnswer: 2,
    class: '10th',
    difficulty: 'Hard',
    createdAt: new Date()
  },
  {
    id: '9',
    question: 'What is the output of print(type([]))?',
    options: ['<class \'array\'>', '<class \'list\'>', '<class \'tuple\'>', '<class \'dict\'>'],
    correctAnswer: 1,
    class: '9th',
    difficulty: 'Easy',
    createdAt: new Date()
  },
  {
    id: '10',
    question: 'Which keyword is used to define a class in Python?',
    options: ['class', 'Class', 'define', 'def'],
    correctAnswer: 0,
    class: '10th',
    difficulty: 'Easy',
    createdAt: new Date()
  }
];

// Sample students
const sampleStudents: Student[] = [
  // 9th Grade - Section A (12 students)
  { id: '1', name: 'Aarav Sharma', rollNumber: '9A001', class: '9th', section: 'A', createdAt: new Date() },
  { id: '2', name: 'Aditi Patel', rollNumber: '9A002', class: '9th', section: 'A', createdAt: new Date() },
  { id: '3', name: 'Arjun Kumar', rollNumber: '9A003', class: '9th', section: 'A', createdAt: new Date() },
  { id: '4', name: 'Ananya Singh', rollNumber: '9A004', class: '9th', section: 'A', createdAt: new Date() },
  { id: '5', name: 'Ayush Gupta', rollNumber: '9A005', class: '9th', section: 'A', createdAt: new Date() },
  { id: '6', name: 'Diya Agarwal', rollNumber: '9A006', class: '9th', section: 'A', createdAt: new Date() },
  { id: '7', name: 'Ishaan Verma', rollNumber: '9A007', class: '9th', section: 'A', createdAt: new Date() },
  { id: '8', name: 'Kavya Joshi', rollNumber: '9A008', class: '9th', section: 'A', createdAt: new Date() },
  { id: '9', name: 'Karan Mehta', rollNumber: '9A009', class: '9th', section: 'A', createdAt: new Date() },
  { id: '10', name: 'Priya Reddy', rollNumber: '9A010', class: '9th', section: 'A', createdAt: new Date() },
  { id: '11', name: 'Rohan Das', rollNumber: '9A011', class: '9th', section: 'A', createdAt: new Date() },
  { id: '12', name: 'Shreya Nair', rollNumber: '9A012', class: '9th', section: 'A', createdAt: new Date() },

  // 9th Grade - Section B (12 students)
  { id: '13', name: 'Abhinav Rao', rollNumber: '9B001', class: '9th', section: 'B', createdAt: new Date() },
  { id: '14', name: 'Aisha Khan', rollNumber: '9B002', class: '9th', section: 'B', createdAt: new Date() },
  { id: '15', name: 'Dev Malhotra', rollNumber: '9B003', class: '9th', section: 'B', createdAt: new Date() },
  { id: '16', name: 'Eesha Bansal', rollNumber: '9B004', class: '9th', section: 'B', createdAt: new Date() },
  { id: '17', name: 'Harsh Tiwari', rollNumber: '9B005', class: '9th', section: 'B', createdAt: new Date() },
  { id: '18', name: 'Ira Saxena', rollNumber: '9B006', class: '9th', section: 'B', createdAt: new Date() },
  { id: '19', name: 'Jatin Bhatt', rollNumber: '9B007', class: '9th', section: 'B', createdAt: new Date() },
  { id: '20', name: 'Meera Iyer', rollNumber: '9B008', class: '9th', section: 'B', createdAt: new Date() },
  { id: '21', name: 'Nikhil Jain', rollNumber: '9B009', class: '9th', section: 'B', createdAt: new Date() },
  { id: '22', name: 'Pooja Sinha', rollNumber: '9B010', class: '9th', section: 'B', createdAt: new Date() },
  { id: '23', name: 'Rahul Chopra', rollNumber: '9B011', class: '9th', section: 'B', createdAt: new Date() },
  { id: '24', name: 'Tanvi Mishra', rollNumber: '9B012', class: '9th', section: 'B', createdAt: new Date() },

  // 9th Grade - Section C (11 students)
  { id: '25', name: 'Akash Pandey', rollNumber: '9C001', class: '9th', section: 'C', createdAt: new Date() },
  { id: '26', name: 'Bhavya Kapoor', rollNumber: '9C002', class: '9th', section: 'C', createdAt: new Date() },
  { id: '27', name: 'Chirag Goyal', rollNumber: '9C003', class: '9th', section: 'C', createdAt: new Date() },
  { id: '28', name: 'Divya Arora', rollNumber: '9C004', class: '9th', section: 'C', createdAt: new Date() },
  { id: '29', name: 'Gaurav Bhatia', rollNumber: '9C005', class: '9th', section: 'C', createdAt: new Date() },
  { id: '30', name: 'Hina Shah', rollNumber: '9C006', class: '9th', section: 'C', createdAt: new Date() },
  { id: '31', name: 'Kartik Dubey', rollNumber: '9C007', class: '9th', section: 'C', createdAt: new Date() },
  { id: '32', name: 'Lavanya Pillai', rollNumber: '9C008', class: '9th', section: 'C', createdAt: new Date() },
  { id: '33', name: 'Manish Yadav', rollNumber: '9C009', class: '9th', section: 'C', createdAt: new Date() },
  { id: '34', name: 'Nisha Thakur', rollNumber: '9C010', class: '9th', section: 'C', createdAt: new Date() },
  { id: '35', name: 'Varun Sethi', rollNumber: '9C011', class: '9th', section: 'C', createdAt: new Date() },

  // 10th Grade - Section A (12 students)
  { id: '36', name: 'Aditya Khanna', rollNumber: '10A001', class: '10th', section: 'A', createdAt: new Date() },
  { id: '37', name: 'Anjali Desai', rollNumber: '10A002', class: '10th', section: 'A', createdAt: new Date() },
  { id: '38', name: 'Aryan Mittal', rollNumber: '10A003', class: '10th', section: 'A', createdAt: new Date() },
  { id: '39', name: 'Deepika Rana', rollNumber: '10A004', class: '10th', section: 'A', createdAt: new Date() },
  { id: '40', name: 'Gautam Soni', rollNumber: '10A005', class: '10th', section: 'A', createdAt: new Date() },
  { id: '41', name: 'Ishita Garg', rollNumber: '10A006', class: '10th', section: 'A', createdAt: new Date() },
  { id: '42', name: 'Kunal Bajaj', rollNumber: '10A007', class: '10th', section: 'A', createdAt: new Date() },
  { id: '43', name: 'Manya Kohli', rollNumber: '10A008', class: '10th', section: 'A', createdAt: new Date() },
  { id: '44', name: 'Naman Ahluwalia', rollNumber: '10A009', class: '10th', section: 'A', createdAt: new Date() },
  { id: '45', name: 'Riya Chawla', rollNumber: '10A010', class: '10th', section: 'A', createdAt: new Date() },
  { id: '46', name: 'Siddharth Lal', rollNumber: '10A011', class: '10th', section: 'A', createdAt: new Date() },
  { id: '47', name: 'Tanya Bose', rollNumber: '10A012', class: '10th', section: 'A', createdAt: new Date() },

  // 10th Grade - Section B (12 students)
  { id: '48', name: 'Abhishek Rawat', rollNumber: '10B001', class: '10th', section: 'B', createdAt: new Date() },
  { id: '49', name: 'Avni Singhal', rollNumber: '10B002', class: '10th', section: 'B', createdAt: new Date() },
  { id: '50', name: 'Dhruv Aggarwal', rollNumber: '10B003', class: '10th', section: 'B', createdAt: new Date() },
  { id: '51', name: 'Garima Tyagi', rollNumber: '10B004', class: '10th', section: 'B', createdAt: new Date() },
  { id: '52', name: 'Himanshu Jha', rollNumber: '10B005', class: '10th', section: 'B', createdAt: new Date() },
  { id: '53', name: 'Jiya Mathur', rollNumber: '10B006', class: '10th', section: 'B', createdAt: new Date() },
  { id: '54', name: 'Laksh Gupta', rollNumber: '10B007', class: '10th', section: 'B', createdAt: new Date() },
  { id: '55', name: 'Muskan Sharma', rollNumber: '10B008', class: '10th', section: 'B', createdAt: new Date() },
  { id: '56', name: 'Parth Jindal', rollNumber: '10B009', class: '10th', section: 'B', createdAt: new Date() },
  { id: '57', name: 'Sakshi Verma', rollNumber: '10B010', class: '10th', section: 'B', createdAt: new Date() },
  { id: '58', name: 'Tushar Modi', rollNumber: '10B011', class: '10th', section: 'B', createdAt: new Date() },
  { id: '59', name: 'Yash Pandya', rollNumber: '10B012', class: '10th', section: 'B', createdAt: new Date() },

  // 10th Grade - Section C (11 students)
  { id: '60', name: 'Arnav Choudhary', rollNumber: '10C001', class: '10th', section: 'C', createdAt: new Date() },
  { id: '61', name: 'Bhumi Patel', rollNumber: '10C002', class: '10th', section: 'C', createdAt: new Date() },
  { id: '62', name: 'Daksh Malhotra', rollNumber: '10C003', class: '10th', section: 'C', createdAt: new Date() },
  { id: '63', name: 'Esha Banerjee', rollNumber: '10C004', class: '10th', section: 'C', createdAt: new Date() },
  { id: '64', name: 'Hardik Joshi', rollNumber: '10C005', class: '10th', section: 'C', createdAt: new Date() },
  { id: '65', name: 'Kiara Sood', rollNumber: '10C006', class: '10th', section: 'C', createdAt: new Date() },
  { id: '66', name: 'Mohit Saini', rollNumber: '10C007', class: '10th', section: 'C', createdAt: new Date() },
  { id: '67', name: 'Palak Goel', rollNumber: '10C008', class: '10th', section: 'C', createdAt: new Date() },
  { id: '68', name: 'Rishabh Kaul', rollNumber: '10C009', class: '10th', section: 'C', createdAt: new Date() },
  { id: '69', name: 'Simran Dhawan', rollNumber: '10C010', class: '10th', section: 'C', createdAt: new Date() },
  { id: '70', name: 'Vivek Rastogi', rollNumber: '10C011', class: '10th', section: 'C', createdAt: new Date() }
];

export function ExamProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<Question[]>(sampleQuestions);
  const [mcqQuestions, setMCQQuestions] = useState<MCQQuestion[]>(sampleMCQQuestions);
  const [students, setStudents] = useState<Student[]>(sampleStudents);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classSections, setClassSections] = useState<ClassSection[]>(CLASS_SECTIONS);

  // Load data from Supabase on component mount
  React.useEffect(() => {
    loadDataFromSupabase();
  }, []);

  const loadDataFromSupabase = async () => {
    try {
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;
      
      if (studentsData && studentsData.length > 0) {
        const formattedStudents: Student[] = studentsData.map(student => ({
          id: student.id,
          name: student.name,
          rollNumber: student.roll_number,
          class: student.class,
          section: student.section,
          createdAt: new Date(student.created_at)
        }));
        setStudents(formattedStudents);
      }

      // Load questions with test cases
      const { data: questionsData, error: questionsError } = await supabase
        .from('questions')
        .select(`
          *,
          test_cases (*)
        `)
        .order('created_at', { ascending: false });

      if (questionsError) throw questionsError;
      
      let formattedQuestions: Question[] = [];
      if (questionsData && questionsData.length > 0) {
        formattedQuestions = questionsData.map(question => ({
          id: question.id,
          title: question.title,
          description: question.description,
          class: question.class,
          difficulty: question.difficulty,
          sampleInput: question.sample_input || '',
          sampleOutput: question.sample_output || '',
          testCases: (question.test_cases || []).map((tc: any) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expected_output,
            isHidden: tc.is_hidden
          })),
          createdAt: new Date(question.created_at)
        }));
        setQuestions(formattedQuestions);
      }

      // Load MCQ questions
      const { data: mcqData, error: mcqError } = await supabase
        .from('mcq_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (mcqError) throw mcqError;
      
      let formattedMCQ: MCQQuestion[] = [];
      if (mcqData && mcqData.length > 0) {
        formattedMCQ = mcqData.map(mcq => ({
          id: mcq.id,
          question: mcq.question,
          options: Array.isArray(mcq.options) ? mcq.options as string[] : [],
          correctAnswer: mcq.correct_answer,
          class: mcq.class,
          difficulty: mcq.difficulty,
          createdAt: new Date(mcq.created_at)
        }));
        setMCQQuestions(formattedMCQ);
      }

      // Load exam sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('exam_sessions')
        .select(`
          *,
          students (*),
          exam_questions (*),
          exam_mcq_questions (*)
        `)
        .order('created_at', { ascending: false });

      if (sessionsError) throw sessionsError;
      
      if (sessionsData && sessionsData.length > 0) {
        // Process exam sessions data
        const formattedSessions: ExamSession[] = [];
        
        for (const session of sessionsData) {
          if (session.students) {
            const student: Student = {
              id: session.students.id,
              name: session.students.name,
              rollNumber: session.students.roll_number,
              class: session.students.class,
              section: session.students.section,
              createdAt: new Date(session.students.created_at)
            };

            // Get questions for this session
            const sessionQuestions = formattedQuestions.filter(q => 
              (session.exam_questions || []).some((eq: any) => eq.question_id === q.id)
            );

            // Get MCQ questions for this session
            const sessionMCQs = formattedMCQ.filter(mcq => 
              (session.exam_mcq_questions || []).some((emcq: any) => emcq.mcq_question_id === mcq.id)
            );

            const formattedSession: ExamSession = {
              id: session.id,
              studentId: session.student_id,
              student,
              class: session.class,
              questions: sessionQuestions,
              mcqQuestions: sessionMCQs,
              answers: {},
              mcqAnswers: {},
              results: {},
              mcqResults: {},
              startTime: new Date(session.start_time),
              codingEndTime: session.coding_end_time ? new Date(session.coding_end_time) : undefined,
              endTime: session.end_time ? new Date(session.end_time) : undefined,
              isSubmitted: session.is_submitted,
              currentPhase: session.current_phase,
              codingScore: session.coding_score,
              mcqScore: session.mcq_score,
              totalScore: session.total_score,
              exitAttempts: session.exit_attempts || 0
            };

            formattedSessions.push(formattedSession);
          }
        }
        
        setExamSessions(formattedSessions);
      }

    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      // Fall back to sample data if database is empty or there's an error
    }
  };

  const addQuestion = (questionData: Omit<Question, 'id' | 'createdAt'>) => {
    saveQuestionToSupabase(questionData);
  };

  const saveQuestionToSupabase = async (questionData: Omit<Question, 'id' | 'createdAt'>) => {
    try {
      // Insert question
      const { data: questionResult, error: questionError } = await supabase
        .from('questions')
        .insert({
          title: questionData.title,
          description: questionData.description,
          class: questionData.class,
          difficulty: questionData.difficulty,
          sample_input: questionData.sampleInput || '',
          sample_output: questionData.sampleOutput || ''
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // Insert test cases
      if (questionData.testCases && questionData.testCases.length > 0) {
        const testCasesData = questionData.testCases.map(tc => ({
          question_id: questionResult.id,
          input: tc.input,
          expected_output: tc.expectedOutput,
          is_hidden: tc.isHidden
        }));

        const { error: testCasesError } = await supabase
          .from('test_cases')
          .insert(testCasesData);

        if (testCasesError) throw testCasesError;
      }

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error saving question to Supabase:', error);
      // Fall back to local storage
      const newQuestion: Question = {
        ...questionData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      setQuestions(prev => [...prev, newQuestion]);
    }
  };

  const addMCQQuestion = (questionData: Omit<MCQQuestion, 'id' | 'createdAt'>) => {
    saveMCQQuestionToSupabase(questionData);
  };

  const saveMCQQuestionToSupabase = async (questionData: Omit<MCQQuestion, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('mcq_questions')
        .insert({
          question: questionData.question,
          options: questionData.options,
          correct_answer: questionData.correctAnswer,
          class: questionData.class,
          difficulty: questionData.difficulty
        });

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error saving MCQ question to Supabase:', error);
      // Fall back to local storage
      const newQuestion: MCQQuestion = {
        ...questionData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      setMCQQuestions(prev => [...prev, newQuestion]);
    }
  };

  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    saveStudentToSupabase(studentData);
  };

  const saveStudentToSupabase = async (studentData: Omit<Student, 'id' | 'createdAt'>) => {
    try {
      const { error } = await supabase
        .from('students')
        .insert({
          name: studentData.name,
          roll_number: studentData.rollNumber,
          class: studentData.class,
          section: studentData.section
        });

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error saving student to Supabase:', error);
      // Fall back to local storage
      const newStudent: Student = {
        ...studentData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
      };
      setStudents(prev => [...prev, newStudent]);
    }
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    updateQuestionInSupabase(id, updates);
  };

  const updateQuestionInSupabase = async (id: string, updates: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          title: updates.title,
          description: updates.description,
          class: updates.class,
          difficulty: updates.difficulty,
          sample_input: updates.sampleInput,
          sample_output: updates.sampleOutput
        })
        .eq('id', id);

      if (error) throw error;

      // Update test cases if provided
      if (updates.testCases) {
        // Delete existing test cases
        await supabase.from('test_cases').delete().eq('question_id', id);
        
        // Insert new test cases
        const testCasesData = updates.testCases.map(tc => ({
          question_id: id,
          input: tc.input,
          expected_output: tc.expectedOutput,
          is_hidden: tc.isHidden
        }));

        await supabase.from('test_cases').insert(testCasesData);
      }

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error updating question in Supabase:', error);
      // Fall back to local update
      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    }
  };

  const updateMCQQuestion = (id: string, updates: Partial<MCQQuestion>) => {
    updateMCQQuestionInSupabase(id, updates);
  };

  const updateMCQQuestionInSupabase = async (id: string, updates: Partial<MCQQuestion>) => {
    try {
      const { error } = await supabase
        .from('mcq_questions')
        .update({
          question: updates.question,
          options: updates.options,
          correct_answer: updates.correctAnswer,
          class: updates.class,
          difficulty: updates.difficulty
        })
        .eq('id', id);

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error updating MCQ question in Supabase:', error);
      // Fall back to local update
      setMCQQuestions(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    }
  };

  const updateStudent = (id: string, updates: Partial<Student>) => {
    updateStudentInSupabase(id, updates);
  };

  const updateStudentInSupabase = async (id: string, updates: Partial<Student>) => {
    try {
      const { error } = await supabase
        .from('students')
        .update({
          name: updates.name,
          roll_number: updates.rollNumber,
          class: updates.class,
          section: updates.section
        })
        .eq('id', id);

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error updating student in Supabase:', error);
      // Fall back to local update
      setStudents(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
    }
  };

  const deleteQuestion = (id: string) => {
    deleteQuestionFromSupabase(id);
  };

  const deleteQuestionFromSupabase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error deleting question from Supabase:', error);
      // Fall back to local delete
      setQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const deleteMCQQuestion = (id: string) => {
    deleteMCQQuestionFromSupabase(id);
  };

  const deleteMCQQuestionFromSupabase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('mcq_questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error deleting MCQ question from Supabase:', error);
      // Fall back to local delete
      setMCQQuestions(prev => prev.filter(q => q.id !== id));
    }
  };

  const deleteStudent = (id: string) => {
    deleteStudentFromSupabase(id);
  };

  const deleteStudentFromSupabase = async (id: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Reload data to update UI
      await loadDataFromSupabase();
    } catch (error) {
      console.error('Error deleting student from Supabase:', error);
      // Fall back to local delete
      setStudents(prev => prev.filter(s => s.id !== id));
    }
  };

  const getQuestionsByClass = (className: '9th' | '10th') => {
    return questions.filter(q => q.class === className);
  };

  const getMCQQuestionsByClass = (className: '9th' | '10th') => {
    return mcqQuestions.filter(q => q.class === className);
  };

  const getStudentsByClass = (className: '9th' | '10th') => {
    return students.filter(s => s.class === className);
  };

  const getRandomQuestions = (className: '9th' | '10th', count: number = 2): Question[] => {
    const classQuestions = getQuestionsByClass(className);
    const shuffled = [...classQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, classQuestions.length));
  };

  const getRandomMCQQuestions = (className: '9th' | '10th', count: number = 5): MCQQuestion[] => {
    const classMCQQuestions = getMCQQuestionsByClass(className);
    const shuffled = [...classMCQQuestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, classMCQQuestions.length));
  };

  const validateAccessCode = (className: '8th' | '9th' | '10th', section: string, accessCode: string): boolean => {
    const classSection = classSections.find(cs => cs.class === className && cs.section === section);
    return classSection ? classSection.accessCode === accessCode : false;
  };

  const getExamDuration = (className: '8th' | '9th' | '10th'): number => {
    const classSection = classSections.find(cs => cs.class === className);
    return classSection ? classSection.duration : 90; // default 90 minutes
  };

  const startExam = async (studentId: string, accessCode: string): Promise<boolean> => {
    const student = students.find(s => s.id === studentId);
    if (!student) return false;

    // Check if student has already taken the exam
    const existingSession = examSessions.find(session => 
      session.studentId === studentId && session.isSubmitted
    );
    
    if (existingSession) {
      alert('You have already completed this exam. Multiple attempts are not allowed.');
      return false;
    }

    // Validate access code
    if (!validateAccessCode(student.class, student.section, accessCode)) {
      return false;
    }

    const selectedQuestions = getRandomQuestions(student.class, 2);
    const selectedMCQQuestions = getRandomMCQQuestions(student.class, 10);
    
    const newSession: ExamSession = {
      id: '', // Let Supabase generate this
      studentId,
      student,
      class: student.class,
      questions: selectedQuestions,
      mcqQuestions: selectedMCQQuestions,
      answers: {},
      mcqAnswers: {},
      results: {},
      mcqResults: {},
      startTime: new Date(),
      isSubmitted: false,
      currentPhase: 'coding',
      codingScore: 0,
      mcqScore: 0,
      totalScore: 0,
      exitAttempts: 0
    };

    // Save initial session to database
    const savedSession = await saveExamSessionToSupabase(newSession);
    if (savedSession) {
      setCurrentSession(savedSession);
    } else {
      setCurrentSession(newSession);
    }
    return true;
  };

  const submitAnswer = (questionId: string, code: string) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      answers: { ...prev.answers, [questionId]: code }
    } : null);
  };

  const submitMCQAnswer = (questionId: string, answer: number) => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? {
      ...prev,
      mcqAnswers: { ...prev.mcqAnswers, [questionId]: answer }
    } : null);
  };

  const evaluateCode = async (questionId: string, code: string): Promise<EvaluationResult> => {
    const question = questions.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found');
    }

    const startTime = Date.now();
    const testResults: TestResult[] = [];
    let hasError = false;
    let errorMessage = '';

    try {
      // Simulate code execution for each test case
      for (const testCase of question.testCases) {
        const testStartTime = Date.now();
        
        try {
          // In a real implementation, you would execute the Python code
          // For now, we'll simulate the execution
          const actualOutput = await simulateCodeExecution(code, testCase.input);
          const testEndTime = Date.now();
          
          testResults.push({
            testCaseId: testCase.id,
            passed: actualOutput.trim() === testCase.expectedOutput.trim(),
            actualOutput: actualOutput.trim(),
            expectedOutput: testCase.expectedOutput.trim(),
            executionTime: testEndTime - testStartTime
          });
        } catch (error) {
          testResults.push({
            testCaseId: testCase.id,
            passed: false,
            actualOutput: '',
            expectedOutput: testCase.expectedOutput.trim(),
            executionTime: Date.now() - testStartTime,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } catch (error) {
      hasError = true;
      errorMessage = error instanceof Error ? error.message : 'Code execution failed';
    }

    const passedTests = testResults.filter(r => r.passed).length;
    const totalTests = testResults.length;
    const score = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    const result: EvaluationResult = {
      questionId,
      code,
      testResults,
      score,
      totalTests,
      passedTests,
      executionTime: Date.now() - startTime,
      hasError,
      errorMessage
    };

    return result;
  };

  const submitCodingSection = async () => {
    if (!currentSession) return;

    try {
      console.log('Starting coding section submission...');
      
      // Evaluate all answers
      const results: { [questionId: string]: EvaluationResult } = {};
      
      for (const question of currentSession.questions) {
        const code = currentSession.answers[question.id] || '';
        console.log(`Evaluating question ${question.id} with code:`, code.substring(0, 50) + '...');
        
        try {
          if (code.trim()) {
            results[question.id] = await evaluateCode(question.id, code);
          } else {
            // Create a default result for empty answers
            results[question.id] = {
              questionId: question.id,
              code: '',
              testResults: [],
              score: 0,
              totalTests: question.testCases.length,
              passedTests: 0,
              executionTime: 0,
              hasError: false
            };
          }
        } catch (evalError) {
          console.error(`Error evaluating question ${question.id}:`, evalError);
          // Create error result
          results[question.id] = {
            questionId: question.id,
            code: code,
            testResults: [],
            score: 0,
            totalTests: question.testCases.length,
            passedTests: 0,
            executionTime: 0,
            hasError: true,
            errorMessage: evalError instanceof Error ? evalError.message : 'Evaluation failed'
          };
        }
      }

      // Calculate coding score
      const scores = Object.values(results).map(r => r.score);
      const codingScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;

      console.log('Coding evaluation complete. Score:', codingScore);
      console.log('Results:', results);

      const updatedSession = currentSession ? {
        ...currentSession,
        results,
        codingEndTime: new Date(),
        currentPhase: 'mcq' as const,
        codingScore,
        // Reduce exit attempts by 1 when submitting coding section
        exitAttempts: Math.max(0, currentSession.exitAttempts - 1)
      } : null;

      if (updatedSession) {
        const savedSession = await saveExamSessionToSupabase(updatedSession);
        setCurrentSession(savedSession || updatedSession);
      }

      console.log('Coding section submitted successfully');

    } catch (error) {
      console.error('Coding section submission failed:', error);
      throw error; // Re-throw to be handled by the UI
    }
  };

  const submitMCQSection = async () => {
    if (!currentSession) return;

    setIsSubmitting(true);
    
    try {
      // Evaluate MCQ answers
      const mcqResults: { [questionId: string]: boolean } = {};
      let correctAnswers = 0;
      
      for (const question of currentSession.mcqQuestions) {
        const userAnswer = currentSession.mcqAnswers[question.id];
        const isCorrect = userAnswer === question.correctAnswer;
        mcqResults[question.id] = isCorrect;
        if (isCorrect) correctAnswers++;
      }

      const mcqScore = currentSession.mcqQuestions.length > 0 
        ? Math.round((correctAnswers / currentSession.mcqQuestions.length) * 100) 
        : 0;

      const totalScore = Math.round((currentSession.codingScore * 0.8) + (mcqScore * 0.2));

      const completedSession: ExamSession = {
        ...currentSession,
        mcqResults,
        endTime: new Date(),
        isSubmitted: true,
        currentPhase: 'completed',
        mcqScore,
        totalScore,
        // Reduce exit attempts by 1 when submitting MCQ section
        exitAttempts: Math.max(0, currentSession.exitAttempts - 1)
      };

      // Save to Supabase
      const savedSession = await saveExamSessionToSupabase(completedSession);
      const finalSession = savedSession || completedSession;
      setExamSessions(prev => [...prev, finalSession]);

      setCurrentSession(null);
    } catch (error) {
      console.error('MCQ section submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveExamSessionToSupabase = async (session: ExamSession): Promise<ExamSession | null> => {
    try {
      // Insert or update exam session
      const { data: sessionData, error: sessionError } = await supabase
        .from('exam_sessions')
        .upsert({
          ...(session.id ? { id: session.id } : {}), // Only include id if it exists
          student_id: session.studentId,
          class: session.class,
          start_time: session.startTime.toISOString(),
          coding_end_time: session.codingEndTime?.toISOString(),
          end_time: session.endTime?.toISOString(),
          current_phase: session.currentPhase,
          coding_score: session.codingScore,
          mcq_score: session.mcqScore,
          total_score: session.totalScore,
          is_submitted: session.isSubmitted,
          exit_attempts: session.exitAttempts
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update session with the generated ID from Supabase
      const updatedSession = {
        ...session,
        id: sessionData.id
      };

      // Save exam questions (coding answers)
      for (const question of updatedSession.questions) {
        const answer = updatedSession.answers[question.id] || '';
        const result = updatedSession.results[question.id];
        
        await supabase
          .from('exam_questions')
          .upsert({
            session_id: updatedSession.id,
            question_id: question.id,
            answer,
            score: result?.score || 0,
            passed_tests: result?.passedTests || 0,
            total_tests: result?.totalTests || 0
          });
      }

      // Save MCQ answers
      for (const mcqQuestion of updatedSession.mcqQuestions) {
        const answer = updatedSession.mcqAnswers[mcqQuestion.id];
        const isCorrect = updatedSession.mcqResults[mcqQuestion.id] || false;
        
        await supabase
          .from('exam_mcq_questions')
          .upsert({
            session_id: updatedSession.id,
            mcq_question_id: mcqQuestion.id,
            answer,
            is_correct: isCorrect
          });
      }

      return updatedSession;

    } catch (error) {
      console.error('Error saving exam session to Supabase:', error);
      // Fall back to localStorage
      const existingSessions = JSON.parse(localStorage.getItem('examSessions') || '[]');
      existingSessions.push(session);
      localStorage.setItem('examSessions', JSON.stringify(existingSessions));
      return null;
    }
  };

  // Helper function to update exit attempts in current session
  const updateExitAttempts = (increment: number) => {
    if (!currentSession) return;
    
    const updatedSession = {
      ...currentSession,
      exitAttempts: currentSession.exitAttempts + increment
    };
    
    setCurrentSession(updatedSession);
    
    // Save to database asynchronously
    saveExamSessionToSupabase(updatedSession).catch(error => {
      console.error('Failed to update exit attempts:', error);
    });
  };

  const updateAccessCode = (className: '8th' | '9th' | '10th', section: string, newAccessCode: string) => {
    setClassSections(prev => prev.map(cs => 
      cs.class === className && cs.section === section 
        ? { ...cs, accessCode: newAccessCode }
        : cs
    ));
    
    // Save to localStorage for persistence
    const updatedSections = classSections.map(cs => 
      cs.class === className && cs.section === section 
        ? { ...cs, accessCode: newAccessCode }
        : cs
    );
    localStorage.setItem('classSections', JSON.stringify(updatedSections));
  };

  // Load access codes from localStorage on mount
  React.useEffect(() => {
    const savedSections = localStorage.getItem('classSections');
    if (savedSections) {
      try {
        const parsedSections = JSON.parse(savedSections);
        setClassSections(parsedSections);
      } catch (error) {
        console.error('Error loading saved access codes:', error);
      }
    }
  }, []);

  return (
    <ExamContext.Provider value={{
      questions,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      getQuestionsByClass,
      mcqQuestions,
      addMCQQuestion,
      updateMCQQuestion,
      deleteMCQQuestion,
      getMCQQuestionsByClass,
      students,
      addStudent,
      updateStudent,
      deleteStudent,
      getStudentsByClass,
      currentSession,
      startExam,
      submitAnswer,
      submitMCQAnswer,
      submitCodingSection,
      submitMCQSection,
      evaluateCode,
      examSessions,
      classSections,
      validateAccessCode,
      getExamDuration,
      updateExitAttempts,
      isSubmitting,
      setIsSubmitting,
      updateAccessCode
    }}>
      {children}
    </ExamContext.Provider>
  );
}

// Simulate Python code execution (in production, use a proper Python interpreter)
async function simulateCodeExecution(code: string, input: string): Promise<string> {
  try {
    // This is a simplified simulation - the CodeCompiler component now provides real Python execution
    // For demonstration, we'll handle some basic cases
    
    await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200)); // Simulate execution time
    
    const lowerCode = code.toLowerCase();
    const inputs = input.split('\n').filter(line => line.trim());
    
    // Sum of two numbers
    if (lowerCode.includes('average') || lowerCode.includes('avg') || 
        (lowerCode.includes('/') && lowerCode.includes('3'))) {
      if (inputs.length >= 3) {
        const num1 = parseFloat(inputs[0]) || 0;
        const num2 = parseFloat(inputs[1]) || 0;
        const num3 = parseFloat(inputs[2]) || 0;
        const average = (num1 + num2 + num3) / 3;
        return average.toFixed(2);
      }
    }
    
    // Sum of two numbers
    if ((lowerCode.includes('input()') || lowerCode.includes('int(input')) && 
        (lowerCode.includes('+') || lowerCode.includes('sum'))) {
      if (inputs.length >= 2) {
        const num1 = parseInt(inputs[0]) || 0;
        const num2 = parseInt(inputs[1]) || 0;
        return (num1 + num2).toString();
      }
    }
    
    // Even/Odd check
    if (lowerCode.includes('%') && lowerCode.includes('2')) {
      if (inputs.length >= 1) {
        const num = parseInt(inputs[0]) || 0;
        return num % 2 === 0 ? 'Even' : 'Odd';
      }
    }
    
    // Factorial calculation
    if (lowerCode.includes('factorial') || 
        (lowerCode.includes('*') && (lowerCode.includes('range') || lowerCode.includes('for')))) {
      if (inputs.length >= 1) {
        const num = parseInt(inputs[0]) || 0;
        if (num < 0) return 'Error: Factorial not defined for negative numbers';
        let result = 1;
        for (let i = 1; i <= num; i++) {
          result *= i;
        }
        return result.toString();
      }
    }
    
    // Prime number check
    if (lowerCode.includes('prime') || 
        (lowerCode.includes('for') && lowerCode.includes('%') && !lowerCode.includes('2'))) {
      if (inputs.length >= 1) {
        const num = parseInt(inputs[0]) || 0;
        if (num < 2) return 'Not Prime';
        for (let i = 2; i <= Math.sqrt(num); i++) {
          if (num % i === 0) return 'Not Prime';
        }
        return 'Prime';
      }
    }
    
    // String reversal
    if (lowerCode.includes('[::-1]') || lowerCode.includes('reverse')) {
      if (inputs.length >= 1) {
        return inputs[0].split('').reverse().join('');
      }
    }
    
    // Maximum in list
    if (lowerCode.includes('max') || lowerCode.includes('maximum')) {
      if (inputs.length >= 1) {
        const numbers = inputs[0].split(' ').map(n => parseInt(n)).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          return Math.max(...numbers).toString();
        }
      }
    }
    
    // Simple print statements
    if (lowerCode.includes('print(')) {
      const printMatch = code.match(/print\s*\(\s*['"]([^'"]*)['"]\s*\)/);
      if (printMatch) {
        return printMatch[1];
      }
    }
    
    // Default: return the input or a simple message
    return inputs.length > 0 ? inputs[0] : 'Code executed successfully';
    
  } catch (error) {
    console.error('Code simulation error:', error);
    throw new Error('Code execution failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
  }
}

export function useExam() {
  const context = useContext(ExamContext);
  if (context === undefined) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
}