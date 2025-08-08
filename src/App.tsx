import React, { useState } from 'react';
import StudentInterface from './components/StudentInterface';
import AdminPanel from './components/AdminPanel';
import { ExamProvider, useExam } from './context/ExamContext';
import { User, Shield } from 'lucide-react';

function App() {
  const [currentView, setCurrentView] = useState<'student' | 'admin'>('student');

  return (
    <ExamProvider>
      <AppContent currentView={currentView} setCurrentView={setCurrentView} />
    </ExamProvider>
  );
}

function AppContent({ currentView, setCurrentView }: { currentView: 'student' | 'admin', setCurrentView: (view: 'student' | 'admin') => void }) {
  const { currentSession } = useExam();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Toggle - Only show when not in exam */}
      {!currentSession && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setCurrentView('student')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'student'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
            }`}
          >
            <User size={18} />
            Student
          </button>
          <button
            onClick={() => setCurrentView('admin')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
              currentView === 'admin'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white text-gray-600 hover:bg-gray-50 shadow-md'
            }`}
          >
            <Shield size={18} />
            Admin
          </button>
        </div>
      )}

      {/* Main Content */}
      {currentView === 'student' ? <StudentInterface /> : <AdminPanel />}
    </div>
  );
}
export default App;