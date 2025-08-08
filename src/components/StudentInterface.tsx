import React, { useState, useRef, useEffect } from 'react';
import { Send, Code, User, Clock, CheckCircle, AlertCircle, BookOpen, Maximize } from 'lucide-react';
import CodeEditor from './CodeEditor';
import CodeCompiler from './CodeCompiler';
import { useExam } from '../context/ExamContext';
import { Student } from '../types/Question';

function StudentInterface() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [accessCode, setAccessCode] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [accessCodeError, setAccessCodeError] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(3600); // 1 hour in seconds
  const [selectedClass, setSelectedClass] = useState<'9th' | '10th'>('9th');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [fullscreenWarning, setFullscreenWarning] = useState(false);
  const [exitAttempts, setExitAttempts] = useState(0);
  
  const { 
    currentSession, 
    students,
    classSections,
    validateAccessCode,
    getExamDuration,
    getStudentsByClass,
    startExam, 
    submitAnswer, 
    submitMCQAnswer,
    submitCodingSection,
    submitMCQSection,
    updateExitAttempts,
    isSubmitting, 
    setIsSubmitting 
  } = useExam();
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Fullscreen management
  const enterFullscreen = async () => {
    try {
      if (containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      }
    } catch (error) {
      console.log('Fullscreen request failed:', error);
    }
  };

  const handleFullscreenChange = () => {
    if (currentSession) {
      if (!document.fullscreenElement) {
        // Don't count as violation if we're submitting
        if (!isSubmitting) {
          updateExitAttempts(1);
          setExitAttempts(prev => prev + 1);
          setFullscreenWarning(true);
        }
        
        // Force back to fullscreen after a short delay
        setTimeout(() => {
          if (!fullscreenWarning && !isSubmitting) {
            enterFullscreen();
          }
        }, 500);
      } else {
        // Successfully in fullscreen, hide warning
        setFullscreenWarning(false);
      }
    }
  };

  const handleFullscreenWarningClose = () => {
    setFullscreenWarning(false);
    setTimeout(() => {
      enterFullscreen();
    }, 100);
  };

  // Timer effect
  useEffect(() => {
    if (!currentSession) return;
    
    // Set initial time based on class
    const duration = getExamDuration(currentSession.class);
    if (timeRemaining === 3600) { // Only set once when exam starts
      setTimeRemaining(duration * 60); // convert minutes to seconds
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (currentSession.currentPhase === 'coding') {
            submitCodingSection(); // Auto-submit coding section when time runs out
          } else if (currentSession.currentPhase === 'mcq') {
            submitMCQSection(); // Auto-submit MCQ section when time runs out
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentSession, submitCodingSection, submitMCQSection, getExamDuration, timeRemaining]);

  // Fullscreen enforcement during exam
  useEffect(() => {
    // Add fullscreen change listener
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Track if we're in a confirm dialog
    let isInConfirmDialog = false;
    
    // Override confirm to track when we're in a dialog
    const originalConfirm = window.confirm;
    window.confirm = function(message) {
      isInConfirmDialog = true;
      const result = originalConfirm.call(this, message);
      setTimeout(() => {
        isInConfirmDialog = false;
      }, 100);
      return result;
    };
    
    // Prevent common exit shortcuts during exam
    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentSession) {
        // Prevent F11, Alt+Tab, Ctrl+Shift+I, F12, etc.
        if (
          e.key === 'F11' ||
          e.key === 'Escape' ||
          (e.altKey && e.key === 'Tab') ||
          (e.ctrlKey && e.shiftKey && e.key === 'I') ||
          (e.ctrlKey && e.shiftKey && e.key === 'J') ||
          (e.ctrlKey && e.shiftKey && e.key === 'C') ||
          e.key === 'F12' ||
          (e.ctrlKey && e.key === 'u') ||
          (e.ctrlKey && e.key === 'r') ||
          e.key === 'F5' ||
          (e.altKey && e.key === 'F4')
        ) {
          e.preventDefault();
          e.stopPropagation();
          if (!isInConfirmDialog) {
            updateExitAttempts(1);
            setExitAttempts(prev => prev + 1);
            setFullscreenWarning(true);
          }
          return false;
        }
      }
    };

    // Prevent right-click context menu during exam
    const handleContextMenu = (e: MouseEvent) => {
      if (currentSession) {
        e.preventDefault();
      }
    };

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu);

    // Prevent page unload during exam
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (currentSession) {
        e.preventDefault();
        e.returnValue = 'Are you sure you want to leave? Your exam progress may be lost.';
        return e.returnValue;
      }
    };

    // Additional fullscreen monitoring
    const handleVisibilityChange = () => {
      if (currentSession && document.hidden && !isInConfirmDialog) {
        updateExitAttempts(1);
        setExitAttempts(prev => prev + 1);
        setFullscreenWarning(true);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      // Restore original confirm
      window.confirm = originalConfirm;
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentSession]);

  // Auto-enter fullscreen when exam starts
  useEffect(() => {
    if (currentSession) {
      enterFullscreen();
    }
  }, [currentSession]);

  const handleAccessCodeSubmit = () => {
    if (!selectedStudent || !accessCode.trim()) {
      setAccessCodeError('Please enter the access code');
      return;
    }

    if (!validateAccessCode(selectedStudent.class, selectedStudent.section, accessCode)) {
      setAccessCodeError('Invalid access code for this class and section');
      return;
    }

    setAccessCodeError('');
    setShowInstructions(true);
  };

  const handleStartExam = async () => {
    if (!selectedStudent || !accessCode.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading
      await enterFullscreen(); // Enter fullscreen before starting exam
      
      const success = await startExam(selectedStudent.id, accessCode);
      if (!success) {
        setAccessCodeError('Failed to start exam. Please check your access code or contact your teacher if you have already completed the exam.');
        setIsSubmitting(false);
        return;
      }
      
      setShowInstructions(false);
      
      // Set exam duration based on class
      const duration = getExamDuration(selectedStudent.class);
      setTimeRemaining(duration * 60);
      
    } catch (error) {
      console.error('Failed to start exam:', error);
      setAccessCodeError('Failed to start exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitCodingSection = async () => {
    if (!currentSession) return;
    
    const confirmed = confirm(
      'Are you sure you want to submit the coding section?\n\n' +
      'You will then proceed to the MCQ section and cannot return to modify your code.'
    );
    
    if (confirmed) {
      setIsSubmitting(true);
      try {
        await submitCodingSection();
      } catch (error) {
        console.error('Error submitting coding section:', error);
        alert('There was an error submitting your coding section. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSubmitMCQSection = async () => {
    if (!currentSession) return;
    
    const confirmed = confirm(
      'Are you sure you want to submit your complete exam?\n\n' +
      'This action cannot be undone and your exam will be finalized.'
    );
    
    if (confirmed) {
      await submitMCQSection();
      setShowSuccess(true);
      
      setTimeout(() => {
        setShowSuccess(false);
        setSelectedStudent(null);
      }, 5000);
    }
  };

  const handleCodeChange = (questionId: string, code: string) => {
    submitAnswer(questionId, code);
  };

  const handleMCQAnswer = (questionId: string, answer: number) => {
    submitMCQAnswer(questionId, answer);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredStudents = students.filter(student => 
    student.class === selectedClass && student.section === selectedSection
  );

  // Show success message after exam submission
  if (showSuccess) {
    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="mx-auto text-green-600 mb-4" size={64} />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Exam Completed Successfully!</h2>
          <p className="text-gray-600 mb-4">
            Your Python lab exam has been submitted and evaluated. Results will be available shortly.
          </p>
          <div className="text-sm text-gray-500">
            Thank you for taking the exam. You may now close this window.
          </div>
        </div>
      </div>
    );
  }

  // Show MCQ section if current phase is MCQ
  if (currentSession && currentSession.currentPhase === 'mcq') {
    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 p-4 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          {/* MCQ Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <BookOpen className="text-purple-600" size={24} />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Multiple Choice Questions</h1>
                <p className="text-sm text-gray-600">
                  {currentSession.student.name} ({currentSession.student.rollNumber}) - Class {currentSession.student.class}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
              }`}>
                <Clock size={18} />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
              
              {exitAttempts > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Exit Attempts: {exitAttempts}</span>
                </div>
              )}
              
              <button
                onClick={handleSubmitMCQSection}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>

          {/* MCQ Questions */}
          <div className="space-y-6">
            {currentSession.mcqQuestions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Question {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">{question.question}</h3>
                  
                  <div className="space-y-3">
                    {question.options.map((option, optionIndex) => (
                      <label
                        key={optionIndex}
                        className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                          currentSession.mcqAnswers[question.id] === optionIndex
                            ? 'border-purple-500 bg-purple-50'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`question-${question.id}`}
                          value={optionIndex}
                          checked={currentSession.mcqAnswers[question.id] === optionIndex}
                          onChange={() => handleMCQAnswer(question.id, optionIndex)}
                          className="mr-3 text-purple-600"
                        />
                        <span className="text-gray-800">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Submit Warning */}
          {timeRemaining < 300 && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-medium">Warning: Less than 5 minutes remaining!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show exam interface if session is active (coding phase)
  if (currentSession && currentSession.currentPhase === 'coding') {
    return (
      <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {/* Exam Header */}
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6 flex items-center justify-between sticky top-4 z-10">
            <div className="flex items-center gap-3">
              <Code className="text-blue-600" size={24} />
              <div>
                <h1 className="text-xl font-bold text-gray-800">Python Lab Examination - Coding Section</h1>
                <p className="text-sm text-gray-600">
                  {currentSession.student.name} ({currentSession.student.rollNumber}) - Class {currentSession.student.class} - Section {currentSession.student.section}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                timeRemaining < 300 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock size={18} />
                <span className="font-mono font-semibold">{formatTime(timeRemaining)}</span>
              </div>
              
              {exitAttempts > 0 && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg">
                  <AlertCircle size={16} />
                  <span className="text-sm font-medium">Exit Attempts: {exitAttempts}</span>
                </div>
              )}
              
              <button
                onClick={handleSubmitCodingSection}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Send size={18} />
                {isSubmitting ? 'Submitting...' : 'Submit Coding Section'}
              </button>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {currentSession.questions.map((question, index) => (
              <div key={question.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Question {index + 1}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {question.difficulty}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">{question.title}</h3>
                  <p className="text-gray-600 mb-4">{question.description}</p>
                  
                  {question.sampleInput && question.sampleOutput && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Sample Input:</h4>
                        <pre className="text-sm text-gray-800 font-mono">{question.sampleInput}</pre>
                      </div>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700 mb-1">Sample Output:</h4>
                        <pre className="text-sm text-gray-800 font-mono">{question.sampleOutput}</pre>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Python Code:
                  </label>
                  <CodeEditor
                    value={currentSession.answers[question.id] || ''}
                    onChange={(code) => handleCodeChange(question.id, code)}
                  />
                </div>

                {/* Code Compiler */}
                <div className="mt-4">
                  <CodeCompiler
                    code={currentSession.answers[question.id] || ''}
                    sampleInput={question.sampleInput}
                    sampleOutput={question.sampleOutput}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Submit Warning */}
          {timeRemaining < 300 && (
            <div className="mt-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={20} />
              <span className="font-medium">Warning: Less than 5 minutes remaining!</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show initial form to start exam
  return (
    <div ref={containerRef} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 overflow-y-auto">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {/* School Branding */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Logo Placeholder */}
            <div className="w-16 h-16 bg-gradient-to-br rounded-full flex items-center justify-center shadow-lg">
              <img src="/logo.png" alt="School Logo" />
            </div>
            
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-800">Kairalee Nilayam Central School</h1>
              <p className="text-gray-600">Artificial Intelligence Lab</p>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <Code className="text-blue-600" size={48} />
            <h2 className="text-4xl font-bold text-gray-800">Python Lab Examination</h2>
          </div>
          <p className="text-gray-600 text-lg">Select your details to begin the exam</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center gap-2 mb-6">
            <User className="text-blue-600" size={24} />
            <h2 className="text-2xl font-semibold text-gray-800">Student Selection</h2>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Class *
              </label>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value as '9th' | '10th');
                  setSelectedStudent(null); // Reset student selection when class changes
                  setAccessCode(''); // Reset access code when class changes
                  setAccessCodeError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="8th">8th Grade</option>
                <option value="9th">9th Grade</option>
                <option value="10th">10th Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Section *
              </label>
              <select
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  setSelectedStudent(null); // Reset student selection when section changes
                  setAccessCode(''); // Reset access code when section changes
                  setAccessCodeError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Your Name *
              </label>
              <select
                value={selectedStudent?.id || ''}
                onChange={(e) => {
                  const student = filteredStudents.find(s => s.id === e.target.value);
                  setSelectedStudent(student || null);
                  setAccessCode(''); // Reset access code when student changes
                  setAccessCodeError('');
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">-- Select Your Name --</option>
                {filteredStudents.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} (Roll: {student.rollNumber})
                  </option>
                ))}
              </select>
              
              {filteredStudents.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No students found for {selectedClass} grade, Section {selectedSection}
                </div>
              )}
            </div>

            {selectedStudent && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Code for {selectedStudent.class} - Section {selectedStudent.section} *
                </label>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value.toUpperCase());
                    setAccessCodeError('');
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                    accessCodeError ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter access code provided by your teacher"
                />
                {accessCodeError && (
                  <p className="mt-1 text-sm text-red-600">{accessCodeError}</p>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={handleAccessCodeSubmit}
              disabled={!selectedStudent || !accessCode.trim() || isSubmitting}
              className={`inline-flex items-center gap-3 px-8 py-4 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                !selectedStudent || !accessCode.trim() || isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
              }`}
            >
              <Code size={24} />
              Continue to Instructions
            </button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <div className="mb-3 text-blue-600 font-medium">
              📚 Kairalee Nilayam Central School - Python Programming Assessment
            </div>
            <p>⏱️ Exam Duration: {selectedStudent ? getExamDuration(selectedStudent.class) : 90} Minutes</p>
            <p>📝 Phase 1: 2 Coding Questions</p>
            <p>📋 Phase 2: 10 Multiple Choice Questions</p>
            <p>💾 Your answers are automatically saved as you type</p>
            <p>📊 Scoring: 80% Coding + 20% MCQ</p>
            <p>🔐 Access code required for exam entry</p>
          </div>
        </div>
      </div>

      {/* Fullscreen Warning Modal */}
      {fullscreenWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center" style={{ zIndex: 2147483647 }}>
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                ⚠️ Security Violation Detected
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                You attempted to exit the exam environment. This is not allowed during the examination.
                {exitAttempts > 0 && (
                  <span className="block mt-2 text-red-600 font-medium">
                    🚨 {exitAttempts} violation{exitAttempts > 1 ? 's' : ''} recorded and logged.
                  </span>
                )}
              </p>
              
              <div className="flex justify-center">
                <button
                  onClick={handleFullscreenWarningClose}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                >
                  <Maximize size={16} />
                  Return to Exam
                </button>
              </div>
              
              {exitAttempts >= 3 && (
                <div className="mt-4 p-4 bg-red-100 border-2 border-red-300 rounded-lg">
                  <p className="text-xs text-red-700">
                    <strong>🚨 FINAL WARNING:</strong> Multiple security violations detected. 
                    Your exam session is being monitored. Further violations may result in automatic exam termination.
                  </p>
                </div>
              )}
              
              <div className="mt-4 text-xs text-gray-400">
                All security violations are logged and reported to administrators.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal */}
      {showInstructions && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4" style={{ zIndex: 2147483647 }}>
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  📋 Exam Instructions
                </h3>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-br rounded-full flex items-center justify-center">
                      <img src="/logo.png" alt="School Logo" />
                    </div>
                    <span className="text-blue-800 font-semibold">Kairalee Nilayam Central School</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    <strong>{selectedStudent.name}</strong> ({selectedStudent.rollNumber}) - 
                    Class {selectedStudent.class} Section {selectedStudent.section}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Duration: <strong>{getExamDuration(selectedStudent.class)} minutes</strong>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>{selectedStudent.name}</strong> ({selectedStudent.rollNumber}) - 
                    Class {selectedStudent.class} Section {selectedStudent.section}
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Duration: <strong>{getExamDuration(selectedStudent.class)} minutes</strong>
                  </p>
                </div>
              </div>
              
              <div className="space-y-4 text-left">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ Important Guidelines</h4>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• <strong>NO MALPRACTICE:</strong> Any form of cheating will result in disqualification</li>
                    <li>• <strong>FULLSCREEN MODE:</strong> You must stay in fullscreen throughout the exam</li>
                    <li>• <strong>NO EXTERNAL HELP:</strong> Do not use any external resources or assistance</li>
                    <li>• <strong>SINGLE ATTEMPT:</strong> You get only one attempt for this exam</li>
                  </ul>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📝 Exam Structure</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• <strong>Phase 1:</strong> Coding Section - 2 Python programming questions</li>
                    <li>• <strong>Phase 2:</strong> MCQ Section - 10 multiple choice questions</li>
                    <li>• <strong>Auto-Save:</strong> Your answers are saved automatically as you type</li>
                    <li>• <strong>Auto-Submit:</strong> Exam will auto-submit when time expires</li>
                  </ul>
                </div>

                <div className="bg-green-50 border-l-4 border-green-400 p-4">
                  <h4 className="font-semibold text-green-800 mb-2">💡 Tips for Success</h4>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Read each question carefully before coding</li>
                    <li>• Test your code with the provided sample inputs</li>
                    <li>• Manage your time wisely between questions</li>
                    <li>• Submit each section when you're confident</li>
                  </ul>
                </div>

                <div className="bg-red-50 border-l-4 border-red-400 p-4">
                  <h4 className="font-semibold text-red-800 mb-2">🚫 Prohibited Actions</h4>
                  <ul className="text-sm text-red-700 space-y-1">
                    <li>• Exiting fullscreen mode (violations will be logged)</li>
                    <li>• Opening other applications or browser tabs</li>
                    <li>• Using external websites, AI tools, or search engines</li>
                    <li>• Communicating with others during the exam</li>
                    <li>• Taking screenshots or recording the exam</li>
                  </ul>
                </div>

                <div className="bg-purple-50 border-l-4 border-purple-400 p-4">
                  <h4 className="font-semibold text-purple-800 mb-2">📊 Scoring Information</h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• <strong>Coding Section:</strong> 80% of total score</li>
                    <li>• <strong>MCQ Section:</strong> 20% of total score</li>
                    <li>• <strong>Evaluation:</strong> Automatic code testing with multiple test cases</li>
                    <li>• <strong>Results:</strong> Available immediately after submission</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowInstructions(false);
                    setAccessCode('');
                    setAccessCodeError('');
                  }}
                  className="px-6 py-3 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartExam}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Starting Exam...
                    </>
                  ) : (
                    <>
                      <Code size={20} />
                      I Understand - Start Exam
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-4 text-center text-xs text-gray-500">
                By clicking "Start Exam", you agree to follow all the above guidelines and understand that violations may result in disqualification.
              </div>
            </div>
          </div>
        </div>
      )}



    </div>
  );
}

export default StudentInterface;