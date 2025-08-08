import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, Clock, User, Book, Code, Plus, Edit, Trash2, Play, CheckCircle, XCircle, Users, HelpCircle, Key, Shield, Lock } from 'lucide-react';
import { useExam } from '../context/ExamContext';
import { Question, MCQQuestion, Student, ExamSession } from '../types/Question';
import QuestionManager from './QuestionManager';
import StudentManager from './StudentManager';
import MCQManager from './MCQManager';

function AdminPanel() {
  const { examSessions, questions, mcqQuestions, students, classSections, updateAccessCode } = useExam();
  const [filteredSessions, setFilteredSessions] = useState<ExamSession[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [selectedSession, setSelectedSession] = useState<ExamSession | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [activeTab, setActiveTab] = useState<'sessions' | 'questions' | 'mcq' | 'students' | 'access-codes'>('sessions');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState<Date | null>(null);
  const [editingAccessCode, setEditingAccessCode] = useState<{
    class: '8th' | '9th' | '10th';
    section: string;
    newCode: string;
  } | null>(null);
  // Simple authentication
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if account is locked
    if (isLocked && lockoutTime) {
      const now = new Date();
      const lockoutEnd = new Date(lockoutTime.getTime() + 15 * 60 * 1000); // 15 minutes lockout
      
      if (now < lockoutEnd) {
        const remainingMinutes = Math.ceil((lockoutEnd.getTime() - now.getTime()) / (60 * 1000));
        alert(`Account is locked due to multiple failed attempts. Please try again in ${remainingMinutes} minutes.`);
        return;
      } else {
        // Reset lockout
        setIsLocked(false);
        setLockoutTime(null);
        setLoginAttempts(0);
      }
    }
    
    if (credentials.username === 'admin' && credentials.password === 'exam2025') {
      setIsAuthenticated(true);
      setLoginAttempts(0);
      setIsLocked(false);
      setLockoutTime(null);
    } else {
      const newAttempts = loginAttempts + 1;
      setLoginAttempts(newAttempts);
      
      if (newAttempts >= 3) {
        setIsLocked(true);
        setLockoutTime(new Date());
        alert('Too many failed login attempts. Account locked for 15 minutes.');
      } else {
        alert(`Invalid credentials. ${3 - newAttempts} attempts remaining before account lockout.`);
      }
      
      // Clear password field
      setCredentials({ ...credentials, password: '' });
    }
  };

  // Filter sessions
  useEffect(() => {
    let filtered = examSessions;

    if (searchTerm) {
      filtered = filtered.filter(
        session =>
          session.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          session.student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (classFilter) {
      filtered = filtered.filter(session => session.class === classFilter);
    }

    setFilteredSessions(filtered);
  }, [examSessions, searchTerm, classFilter]);

  const exportToCSV = () => {
    const csvContent = [
      ['Name', 'Roll Number', 'Class', 'Section', 'Start Time', 'End Time', 'Coding Score', 'MCQ Score', 'Total Score'],
      ...filteredSessions.map(session => {
        return [
          session.student.name,
          session.student.rollNumber,
          session.class,
          session.student.section,
          session.startTime.toLocaleString(),
          session.endTime?.toLocaleString() || 'In Progress',
          `${session.codingScore}%`,
          `${session.mcqScore}%`,
          `${session.totalScore}%`
        ];
      })
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `python_exam_results_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleUpdateAccessCode = () => {
    if (!editingAccessCode) return;
    
    if (!editingAccessCode.newCode.trim()) {
      alert('Access code cannot be empty');
      return;
    }
    
    if (editingAccessCode.newCode.length < 6) {
      alert('Access code must be at least 6 characters long');
      return;
    }
    
    updateAccessCode(editingAccessCode.class, editingAccessCode.section, editingAccessCode.newCode.toUpperCase());
    setEditingAccessCode(null);
    alert('Access code updated successfully!');
  };

  const handleLogout = () => {
    const confirmed = confirm('Are you sure you want to logout?');
    if (confirmed) {
      setIsAuthenticated(false);
      setCredentials({ username: '', password: '' });
      setActiveTab('sessions');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
              <Shield className="text-blue-600" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
            <p className="text-gray-600 mt-2">Access the exam management panel</p>
            {isLocked && lockoutTime && (
              <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                <div className="flex items-center gap-2 text-red-700">
                  <Lock size={16} />
                  <span className="text-sm font-medium">Account Locked</span>
                </div>
                <p className="text-xs text-red-600 mt-1">
                  Too many failed attempts. Try again in 15 minutes.
                </p>
              </div>
            )}
            {loginAttempts > 0 && !isLocked && (
              <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-xs text-yellow-700">
                  {3 - loginAttempts} attempts remaining
                </p>
              </div>
            )}
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <input
                type="text"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLocked}
              className={`w-full py-2 px-4 rounded-lg transition-colors font-medium ${
                isLocked 
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isLocked ? 'Account Locked' : 'Login'}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-gray-500">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Shield size={12} />
              <span>Secure Admin Access</span>
            </div>
            <p>Account will be locked for 15 minutes after 3 failed attempts</p>
          </div>
         
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Book className="text-blue-600" size={32} />
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 bg-gradient-to-br rounded-full flex items-center justify-center">
                 <img src="/logo.png" alt="School Logo" />
                  </div>
                  <span className="text-sm text-gray-600">Kairalee Nilayam Central School</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
                <p className="text-gray-600">Python Lab Exam Management</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Total Sessions: <span className="font-semibold text-blue-600">{examSessions.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Total Questions: <span className="font-semibold text-blue-600">{questions.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                MCQ Questions: <span className="font-semibold text-blue-600">{mcqQuestions.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Students: <span className="font-semibold text-blue-600">{students.length}</span>
              </div>
              <div className="text-sm text-gray-600">
                Scoring: <span className="font-semibold text-blue-600">80% Coding + 20% MCQ</span>
              </div>
              <button
                onClick={() => setIsAuthenticated(false)}
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
              >
                <Lock size={16} />
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'sessions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Play size={20} />
              Exam Sessions
            </button>
            <button
              onClick={() => setActiveTab('questions')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'questions'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Code size={20} />
              Question Bank
            </button>
            <button
              onClick={() => setActiveTab('mcq')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'mcq'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <HelpCircle size={20} />
              MCQ Questions
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'students'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users size={20} />
              Students
            </button>
            <button
              onClick={() => setActiveTab('access-codes')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'access-codes'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Key size={20} />
              Access Codes
            </button>
          </div>
        </div>

        {activeTab === 'sessions' ? (
          <>
            {/* Filters and Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by name or roll number..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Classes</option>
                  <option value="9th">9th Grade</option>
                  <option value="10th">10th Grade</option>
                </select>

                <button
                  onClick={exportToCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download size={20} />
                  Export Results
                </button>
              </div>
            </div>

            {/* Sessions Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <User size={16} />
                          Student
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Roll Number
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Section
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          Duration
                        </div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phase
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Scores
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredSessions.map((session) => {
                      const duration = session.endTime 
                        ? Math.round((session.endTime.getTime() - session.startTime.getTime()) / 60000)
                        : Math.round((Date.now() - session.startTime.getTime()) / 60000);
                      
                      return (
                        <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{session.student.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {session.student.rollNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.class === '8th' ? 'bg-purple-100 text-purple-800' :
                              session.class === '9th' 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {session.class}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                            {session.student.section}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                            {duration} min
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              session.currentPhase === 'completed' ? 'bg-green-100 text-green-800' :
                              session.currentPhase === 'mcq' ? 'bg-purple-100 text-purple-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {session.currentPhase === 'completed' ? 'Completed' :
                               session.currentPhase === 'mcq' ? 'MCQ Phase' :
                               'Coding Phase'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {session.isSubmitted ? (
                              <div className="text-xs space-y-1">
                                <div>Coding: {session.codingScore}%</div>
                                <div>MCQ: {session.mcqScore}%</div>
                                <div className="font-semibold">Total: {session.totalScore}%</div>
                                <div className="text-red-600">Exit Attempts: {session.exitAttempts}</div>
                                <div className="text-green-600 font-medium">✓ Completed</div>
                              </div>
                            ) : (
                              <span className="text-gray-500 text-sm">In Progress</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => setSelectedSession(session)}
                              className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                            >
                              <Eye size={16} />
                              View Details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredSessions.length === 0 && (
                <div className="text-center py-12">
                  <Play className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-500">No exam sessions found</p>
                </div>
              )}
            </div>
          </>
        ) : activeTab === 'questions' ? (
          <QuestionManager />
        ) : activeTab === 'mcq' ? (
          <MCQManager />
        ) : (
          <StudentManager />
        )}
      </div>

      {/* Session Details Modal */}
      {selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{selectedSession.student.name}</h3>
                  <p className="text-sm text-gray-600">
                    Roll: {selectedSession.student.rollNumber} | Class: {selectedSession.class} | Section: {selectedSession.student.section} |
                    Started: {selectedSession.startTime.toLocaleString()}
                    {selectedSession.endTime && ` | Ended: ${selectedSession.endTime.toLocaleString()}`}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-auto max-h-[70vh]">
              <div className="space-y-6">
                {/* Coding Questions */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">Coding Questions</h4>
                {selectedSession.questions.map((question, index) => {
                  const answer = selectedSession.answers[question.id] || '';
                  const result = selectedSession.results[question.id];
                  
                  return (
                    <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold">
                            Q{index + 1}
                          </span>
                          <h4 className="font-semibold text-gray-800">{question.title}</h4>
                          {result && (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${
                              result.score >= 70 ? 'bg-green-100 text-green-800' :
                              result.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {result.score}% ({result.passedTests}/{result.totalTests} tests passed)
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{question.description}</p>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div>
                          <h5 className="font-medium text-gray-700 mb-2">Student's Answer:</h5>
                          <pre className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto max-h-40">
                            {answer || 'No answer provided'}
                          </pre>
                        </div>
                        
                        {result && (
                          <div>
                            <h5 className="font-medium text-gray-700 mb-2">Test Results:</h5>
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {result.testResults.map((test, testIndex) => (
                                <div key={testIndex} className={`p-2 rounded text-xs ${
                                  test.passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                                }`}>
                                  <div className="flex items-center gap-2 mb-1">
                                    {test.passed ? (
                                      <CheckCircle size={12} className="text-green-600" />
                                    ) : (
                                      <XCircle size={12} className="text-red-600" />
                                    )}
                                    <span className="font-medium">
                                      Test {testIndex + 1}: {test.passed ? 'PASSED' : 'FAILED'}
                                    </span>
                                  </div>
                                  {!test.passed && (
                                    <div className="text-gray-600">
                                      <div>Expected: {test.expectedOutput}</div>
                                      <div>Got: {test.actualOutput}</div>
                                      {test.error && <div>Error: {test.error}</div>}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>

                {/* MCQ Questions */}
                {selectedSession.mcqQuestions.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4">MCQ Questions</h4>
                    {selectedSession.mcqQuestions.map((question, index) => {
                      const userAnswer = selectedSession.mcqAnswers[question.id];
                      const isCorrect = selectedSession.mcqResults[question.id];
                      
                      return (
                        <div key={question.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="bg-purple-600 text-white px-2 py-1 rounded text-sm font-semibold">
                                MCQ {index + 1}
                              </span>
                              <h4 className="font-semibold text-gray-800">{question.question}</h4>
                              {userAnswer !== undefined && (
                                <span className={`px-2 py-1 rounded text-xs font-semibold ${
                                  isCorrect ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {isCorrect ? 'Correct' : 'Incorrect'}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {question.options.map((option, optionIndex) => (
                              <div
                                key={optionIndex}
                                className={`p-2 rounded text-sm ${
                                  optionIndex === question.correctAnswer
                                    ? 'bg-green-100 border border-green-300'
                                    : userAnswer === optionIndex && optionIndex !== question.correctAnswer
                                    ? 'bg-red-100 border border-red-300'
                                    : userAnswer === optionIndex
                                    ? 'bg-blue-100 border border-blue-300'
                                    : 'bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {optionIndex === question.correctAnswer && (
                                    <CheckCircle size={16} className="text-green-600" />
                                  )}
                                  {userAnswer === optionIndex && optionIndex !== question.correctAnswer && (
                                    <XCircle size={16} className="text-red-600" />
                                  )}
                                  <span>{option}</span>
                                  {optionIndex === question.correctAnswer && (
                                    <span className="text-xs text-green-600 font-medium">(Correct Answer)</span>
                                  )}
                                  {userAnswer === optionIndex && (
                                    <span className="text-xs text-blue-600 font-medium">(Student's Answer)</span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Access Code Modal */}
      {editingAccessCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Key className="text-blue-600" size={24} />
                  <h3 className="text-xl font-semibold text-gray-800">Update Access Code</h3>
                </div>
                <button
                  onClick={() => setEditingAccessCode(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-blue-800">
                    <strong>Class {editingAccessCode.class} - Section {editingAccessCode.section}</strong>
                  </p>
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Access Code *
                </label>
                <input
                  type="text"
                  value={editingAccessCode.newCode}
                  onChange={(e) => setEditingAccessCode({
                    ...editingAccessCode,
                    newCode: e.target.value.toUpperCase()
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                  placeholder="Enter new access code"
                  minLength={6}
                  maxLength={20}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 characters. Will be converted to uppercase.
                </p>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-1">
                  <Shield size={16} />
                  <span className="text-sm font-medium">Security Notice</span>
                </div>
                <p className="text-xs text-yellow-700">
                  Changing the access code will require students to use the new code for exam access.
                  Make sure to communicate the new code to students before their exam.
                </p>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setEditingAccessCode(null)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateAccessCode}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Update Access Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;