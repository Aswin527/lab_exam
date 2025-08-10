import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Question, MCQQuestion, Student, ExamSession, ClassSection } from '../types/Question';

interface ExamContextType {
  // Student management
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => Promise<boolean>;
  
  // Exam sessions
  examSessions: ExamSession[];
  currentSession: ExamSession | null;
  startExam: (student: Student) => Promise<boolean>;
  submitExam: () => Promise<void>;
  
  // Questions
  questions: Question[];
  currentQuestions: Question[];
  mcqQuestions: MCQQuestion[];
  addQuestion: (question: Omit<Question, 'id'>) => Promise<void>;
  updateQuestion: (id: string, question: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  addMCQQuestion: (question: Omit<MCQQuestion, 'id'>) => Promise<void>;
  updateMCQQuestion: (id: string, question: Partial<MCQQuestion>) => Promise<void>;
  deleteMCQQuestion: (id: string) => Promise<void>;
  
  // Answers
  saveAnswer: (questionId: string, answer: string) => Promise<void>;
  saveMCQAnswer: (questionId: string, answer: number) => Promise<void>;
  
  // Phase management
  switchPhase: (phase: 'coding' | 'mcq') => void;
  
  // Admin
  isAdmin: boolean;
  adminLogin: (username: string, password: string) => boolean;
  adminLogout: () => void;
  
  // Access codes
  accessCodes: Record<string, string>;
  updateAccessCode: (classValue: '8th' | '9th' | '10th', section: string, newCode: string) => void;
  
  // Class sections
  classSections: ClassSection[];
  validateAccessCode: (classValue: string, section: string, code: string) => boolean;
  getExamDuration: (classValue: string) => number;
  getStudentsByClass: (classValue: string, section: string) => Student[];
  
  // Security
  loginAttempts: number;
  isLocked: boolean;
  lockoutTime: number;
  
  // Loading states
  loading: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (submitting: boolean) => void;
  loadExamSessions: () => Promise<void>;
  
  // Exam submission
  submitCodingSection: () => Promise<void>;
  submitMCQSection: () => Promise<void>;
  updateExitAttempts: (sessionId: string) => Promise<void>;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

export const useExam = () => {
  const context = useContext(ExamContext);
  if (!context) {
    throw new Error('useExam must be used within an ExamProvider');
  }
  return context;
};

export const ExamProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ExamSession | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [mcqQuestions, setMCQQuestions] = useState<MCQQuestion[]>([]);
  const [currentQuestions, setCurrentQuestions] = useState<Question[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  
  // Default access codes
  const [accessCodes, setAccessCodes] = useState<Record<string, string>>({
    '8A': 'EXAM2025',
    '8B': 'EXAM2025',
    '8C': 'EXAM2025',
    '9A': 'EXAM2025',
    '9B': 'EXAM2025',
    '9C': 'EXAM2025',
    '10A': 'EXAM2025',
    '10B': 'EXAM2025',
    '10C': 'EXAM2025',
    '11A': 'EXAM2025',
    '11B': 'EXAM2025',
    '11C': 'EXAM2025',
    '12A': 'EXAM2025',
    '12B': 'EXAM2025',
    '12C': 'EXAM2025',
  });

  // Class sections data
  const classSections: ClassSection[] = [
    { class: '8th', section: 'A', accessCode: accessCodes['8A'] || 'EXAM2025', duration: 120 },
    { class: '8th', section: 'B', accessCode: accessCodes['8B'] || 'EXAM2025', duration: 120 },
    { class: '8th', section: 'C', accessCode: accessCodes['8C'] || 'EXAM2025', duration: 120 },
    { class: '9th', section: 'A', accessCode: accessCodes['9A'] || 'EXAM2025', duration: 120 },
    { class: '9th', section: 'B', accessCode: accessCodes['9B'] || 'EXAM2025', duration: 120 },
    { class: '9th', section: 'C', accessCode: accessCodes['9C'] || 'EXAM2025', duration: 120 },
    { class: '10th', section: 'A', accessCode: accessCodes['10A'] || 'EXAM2025', duration: 120 },
    { class: '10th', section: 'B', accessCode: accessCodes['10B'] || 'EXAM2025', duration: 120 },
    { class: '10th', section: 'C', accessCode: accessCodes['10C'] || 'EXAM2025', duration: 120 },
  ];

  // Load data on mount
  useEffect(() => {
    loadQuestions();
    loadMCQQuestions();
    loadStudents();
    loadExamSessions();
    loadAccessCodes();
    checkLockoutStatus();
  }, []);

  // Load access codes from localStorage
  const loadAccessCodes = () => {
    const saved = localStorage.getItem('examAccessCodes');
    if (saved) {
      setAccessCodes(JSON.parse(saved));
    }
  };

  // Check lockout status
  const checkLockoutStatus = () => {
    const lockoutEnd = localStorage.getItem('adminLockoutEnd');
    if (lockoutEnd) {
      const now = Date.now();
      const lockEnd = parseInt(lockoutEnd);
      if (now < lockEnd) {
        setIsLocked(true);
        setLockoutTime(lockEnd);
        const attempts = localStorage.getItem('adminLoginAttempts');
        setLoginAttempts(attempts ? parseInt(attempts) : 0);
      } else {
        // Lockout expired, clear it
        localStorage.removeItem('adminLockoutEnd');
        localStorage.removeItem('adminLoginAttempts');
        setIsLocked(false);
        setLoginAttempts(0);
      }
    }
  };

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
    }
  };

  const loadMCQQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('mcq_questions')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const mcqQuestions = (data || []).map(mcq => ({
        id: mcq.id,
        question: mcq.question,
        options: mcq.options,
        correctAnswer: mcq.correct_answer,
        class: mcq.class,
        difficulty: mcq.difficulty,
        createdAt: new Date(mcq.created_at),
      }));
      
      setMCQQuestions(mcqQuestions);
    } catch (error) {
      console.error('Error loading MCQ questions:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadExamSessions = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('exam_sessions')
        .select('*')
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      const sessions = (data || []).map(session => ({
        id: session.id,
        studentId: session.student_id || '',
        student: {
          id: session.student_id || '',
          name: session.student_name || '',
          rollNumber: session.roll_number || '',
          class: session.class as '8th' | '9th' | '10th',
          section: session.section || '',
          createdAt: new Date(),
        },
        class: session.class,
        questions: [],
        mcqQuestions: [],
        answers: session.answers || {},
        mcqAnswers: session.mcq_answers || {},
        results: {},
        mcqResults: {},
        startTime: session.start_time,
        codingEndTime: session.coding_end_time ? new Date(session.coding_end_time) : undefined,
        endTime: session.end_time,
        isSubmitted: session.is_submitted,
        currentPhase: session.current_phase as 'coding' | 'mcq' | 'completed',
        codingScore: session.coding_score || 0,
        mcqScore: session.mcq_score || 0,
        totalScore: session.total_score || 0,
        exitAttempts: session.exit_attempts || 0,
      }));
      
      setExamSessions(sessions);
    } catch (error) {
      console.error('Error loading exam sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const addStudent = async (studentData: Omit<Student, 'id'>): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .insert([{
          name: studentData.name,
          roll_number: studentData.rollNumber,
          class: studentData.class,
          section: studentData.section,
        }])
        .select()
        .single();

      if (error) throw error;

      const newStudent: Student = {
        id: data.id,
        name: data.name,
        rollNumber: data.roll_number,
        class: data.class,
        section: data.section,
      };

      setStudents(prev => [newStudent, ...prev]);
      return true;
    } catch (error) {
      console.error('Error adding student:', error);
      return false;
    }
  };

  const selectQuestionsForExam = (): Question[] => {
    const easyQuestions = questions.filter(q => q.difficulty === 'Easy');
    const mediumQuestions = questions.filter(q => q.difficulty === 'Medium');
    
    const selectedQuestions: Question[] = [];
    
    // Select 1 easy question
    if (easyQuestions.length > 0) {
      const randomEasy = easyQuestions[Math.floor(Math.random() * easyQuestions.length)];
      selectedQuestions.push(randomEasy);
    }
    
    // Select 1 medium question
    if (mediumQuestions.length > 0) {
      const randomMedium = mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)];
      selectedQuestions.push(randomMedium);
    }
    
    // If we don't have enough questions of required difficulty, fill with any available
    if (selectedQuestions.length < 2) {
      const remainingQuestions = questions.filter(q => !selectedQuestions.includes(q));
      while (selectedQuestions.length < 2 && remainingQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * remainingQuestions.length);
        selectedQuestions.push(remainingQuestions.splice(randomIndex, 1)[0]);
      }
    }
    
    return selectedQuestions;
  };

  const startExam = async (student: Student): Promise<boolean> => {
    try {
      // Check if student already has a completed exam
      const existingSession = examSessions.find(
        session => session.studentId === student.id && session.isSubmitted
      );
      
      if (existingSession) {
        alert('You have already completed this exam. Multiple attempts are not allowed.');
        return false;
      }

      const selectedQuestions = selectQuestionsForExam();
      setCurrentQuestions(selectedQuestions);

      const { data, error } = await supabase
        .from('exam_sessions')
        .insert([{
          student_id: student.id,
          student_name: student.name || '',
          roll_number: student.rollNumber || '',
          class: student.class,
          section: student.section || '',
          start_time: new Date().toISOString(),
          current_phase: 'coding',
          is_submitted: false,
          coding_score: 0,
          mcq_score: 0,
          total_score: 0,
          answers: {},
          mcq_answers: {},
          exit_attempts: 0,
        }])
        .select()
        .single();

      if (error) throw error;

      const newSession: ExamSession = {
        id: data.id,
        studentId: student.id,
        student: student,
        class: student.class,
        questions: selectedQuestions,
        mcqQuestions: [],
        answers: {},
        mcqAnswers: {},
        results: {},
        mcqResults: {},
        startTime: new Date(data.start_time),
        isSubmitted: false,
        currentPhase: 'coding' as 'coding' | 'mcq' | 'completed',
        codingScore: 0,
        mcqScore: 0,
        totalScore: 0,
        exitAttempts: 0,
      };

      setCurrentSession(newSession);
      setExamSessions(prev => [newSession, ...prev]);
      return true;
    } catch (error) {
      console.error('Error starting exam:', error);
      return false;
    }
  };

  const saveAnswer = async (questionId: string, answer: string) => {
    if (!currentSession) return;

    try {
      const updatedAnswers = { ...currentSession.answers, [questionId]: answer };
      
      const { error } = await supabase
        .from('exam_sessions')
        .update({ answers: updatedAnswers })
        .eq('id', currentSession.id);

      if (error) throw error;

      setCurrentSession(prev => prev ? { ...prev, answers: updatedAnswers } : null);
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const saveMCQAnswer = async (questionId: string, answer: string) => {
    if (!currentSession) return;

    try {
      const updatedMCQAnswers = { ...currentSession.mcqAnswers, [questionId]: answer };
      
      // Save to database immediately
      const { error } = await supabase
        .from('exam_sessions')
        .update({ mcq_answers: updatedMCQAnswers })
        .eq('id', currentSession.id);

      if (error) throw error;

      // Update local state
      setCurrentSession(prev => prev ? { ...prev, mcqAnswers: updatedMCQAnswers } : null);
      
      // Update the exam sessions list
      setExamSessions(prev => prev.map(session => 
        session.id === currentSession.id 
          ? { ...session, mcqAnswers: updatedMCQAnswers }
          : session
      ));
    } catch (error) {
      console.error('Error saving MCQ answer:', error);
    }
  };

  const switchPhase = (phase: 'coding' | 'mcq') => {
    if (!currentSession) return;

    setCurrentSession(prev => prev ? { ...prev, currentPhase: phase } : null);
  };

  const calculateScores = (session: ExamSession): { codingScore: number; mcqScore: number; totalScore: number } => {
    let codingScore = 0;
    let mcqScore = 0;

    // Calculate coding score (80% weight)
    const codingQuestions = session.questions.filter(q => q.type === 'coding');
    if (codingQuestions.length > 0) {
      let codingPoints = 0;
      codingQuestions.forEach(question => {
        const answer = session.answers[question.id];
        if (answer && answer.trim()) {
          codingPoints += 50; // 50 points per coding question
        }
      });
      codingScore = (codingPoints / (codingQuestions.length * 50)) * 100;
    }

    // Calculate MCQ score (20% weight)
    const mcqQuestions = session.mcqQuestions;
    if (mcqQuestions.length > 0) {
      let correctAnswers = 0;
      mcqQuestions.forEach(question => {
        const studentAnswer = session.mcqAnswers[question.id];
        if (studentAnswer === question.correctAnswer) {
          correctAnswers++;
        }
      });
      mcqScore = (correctAnswers / mcqQuestions.length) * 100;
    }

    // Total score: 80% coding + 20% MCQ
    const totalScore = Math.round((codingScore * 0.8) + (mcqScore * 0.2));

    return {
      codingScore: Math.round(codingScore),
      mcqScore: Math.round(mcqScore),
      totalScore
    };
  };

  const submitExam = async () => {
    if (!currentSession) return;

    try {
      const scores = calculateScores(currentSession);
      
      const { error } = await supabase
        .from('exam_sessions')
        .update({
          end_time: new Date().toISOString(),
          is_submitted: true,
          coding_score: scores.codingScore,
          mcq_score: scores.mcqScore,
          total_score: scores.totalScore,
        })
        .eq('id', currentSession.id);

      if (error) throw error;

      const updatedSession = {
        ...currentSession,
        endTime: new Date().toISOString(),
        isSubmitted: true,
        codingScore: scores.codingScore,
        mcqScore: scores.mcqScore,
        totalScore: scores.totalScore,
      };

      setExamSessions(prev => prev.map(session => 
        session.id === currentSession.id ? updatedSession : session
      ));
      
      setCurrentSession(null);
      setCurrentQuestions([]);
    } catch (error) {
      console.error('Error submitting exam:', error);
    }
  };

  const addQuestion = async (questionData: Omit<Question, 'id'>) => {
    try {
      const { data, error } = await supabase
        .from('questions')
        .insert([{
          title: questionData.title,
          description: questionData.description,
          class: questionData.class,
          difficulty: questionData.difficulty,
          sample_input: questionData.sampleInput,
          sample_output: questionData.sampleOutput,
        }])
        .select()
        .single();

      if (error) throw error;

      const newQuestion: Question = {
        id: data.id,
        title: data.title,
        description: data.description,
        class: data.class,
        difficulty: data.difficulty,
        testCases: [],
        sampleInput: data.sample_input,
        sampleOutput: data.sample_output,
        createdAt: new Date(data.created_at),
      };

      setQuestions(prev => [newQuestion, ...prev]);
      
      // Add test cases separately if they exist
      if (questionData.testCases && questionData.testCases.length > 0) {
        for (const testCase of questionData.testCases) {
          await supabase
            .from('test_cases')
            .insert([{
              question_id: data.id,
              input: testCase.input,
              expected_output: testCase.expectedOutput,
              is_hidden: testCase.isHidden,
            }]);
        }
      }
    } catch (error) {
      console.error('Error adding question:', error);
    }
  };

  const updateQuestion = async (id: string, questionData: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({
          title: questionData.title,
          description: questionData.description,
          class: questionData.class,
          difficulty: questionData.difficulty,
          sample_input: questionData.sampleInput,
          sample_output: questionData.sampleOutput,
        })
        .eq('id', id);

      if (error) throw error;

      setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...questionData } : q));
      
      // Update test cases separately if they exist
      if (questionData.testCases) {
        // Delete existing test cases
        await supabase
          .from('test_cases')
          .delete()
          .eq('question_id', id);
        
        // Insert new test cases
        for (const testCase of questionData.testCases) {
          await supabase
            .from('test_cases')
            .insert([{
              question_id: id,
              input: testCase.input,
              expected_output: testCase.expectedOutput,
              is_hidden: testCase.isHidden,
            }]);
        }
      }
    } catch (error) {
      console.error('Error updating question:', error);
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuestions(prev => prev.filter(q => q.id !== id));
    } catch (error) {
      console.error('Error deleting question:', error);
    }
  };

  const adminLogin = (username: string, password: string): boolean => {
    if (isLocked) {
      return false;
    }

    if (username === 'admin' && password === 'exam2025') {
      setIsAdmin(true);
      setLoginAttempts(0);
      localStorage.removeItem('adminLoginAttempts');
      localStorage.removeItem('adminLockoutEnd');
      return true;
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      localStorage.setItem('adminLoginAttempts', newAttempts.toString());

      if (newAttempts >= 3) {
        const lockoutEnd = Date.now() + (15 * 60 * 1000); // 15 minutes
        setIsLocked(true);
        setLockoutTime(lockoutEnd);
        localStorage.setItem('adminLockoutEnd', lockoutEnd.toString());
      }

      return false;
    }
  };

  const adminLogout = () => {
    setIsAdmin(false);
  };

  const updateAccessCode = (classSection: string, newCode: string) => {
    const updatedCodes = { ...accessCodes, [classSection]: newCode };
    setAccessCodes(updatedCodes);
    localStorage.setItem('examAccessCodes', JSON.stringify(updatedCodes));
  };

  const value: ExamContextType = {
    students,
    addStudent,
    examSessions,
    currentSession,
    startExam,
    submitExam,
    questions,
    currentQuestions,
    mcqQuestions,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addMCQQuestion,
    updateMCQQuestion,
    deleteMCQQuestion,
    saveAnswer,
    saveMCQAnswer,
    switchPhase,
    isAdmin,
    adminLogin,
    adminLogout,
    accessCodes,
    updateAccessCode,
    classSections,
    validateAccessCode,
    getExamDuration,
    getStudentsByClass,
    loginAttempts,
    isLocked,
    lockoutTime,
    loading,
    isSubmitting,
    setIsSubmitting,
    loadExamSessions,
    submitCodingSection,
    submitMCQSection,
    updateExitAttempts,
  };

  return (
    <ExamContext.Provider value={value}>
      {children}
    </ExamContext.Provider>
  );
};