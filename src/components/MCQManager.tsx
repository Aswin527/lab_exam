import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, HelpCircle } from 'lucide-react';
import { useExam } from '../context/ExamContext';
import { MCQQuestion } from '../types/Question';

function MCQManager() {
  const { mcqQuestions, addMCQQuestion, updateMCQQuestion, deleteMCQQuestion } = useExam();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<'all' | '9th' | '10th'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    questionId: string;
    questionText: string;
  }>({
    show: false,
    questionId: '',
    questionText: ''
  });

  const [newQuestion, setNewQuestion] = useState<Omit<MCQQuestion, 'id' | 'createdAt'>>({
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    class: '9th',
    difficulty: 'Easy'
  });

  const filteredQuestions = mcqQuestions.filter(q => 
    classFilter === 'all' || q.class === classFilter
  );

  const handleOptionChange = (index: number, value: string) => {
    setNewQuestion(prev => ({
      ...prev,
      options: prev.options.map((opt, i) => i === index ? value : opt)
    }));
  };

  const handleSaveQuestion = () => {
    if (!newQuestion.question.trim()) {
      alert('Please enter the question text');
      return;
    }

    if (newQuestion.options.some(opt => !opt.trim())) {
      alert('Please fill in all option fields');
      return;
    }

    addMCQQuestion(newQuestion);
    setIsAddingQuestion(false);
    setNewQuestion({
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      class: '9th',
      difficulty: 'Easy'
    });
  };

  const handleDeleteQuestion = (id: string, questionText: string) => {
    setShowDeleteConfirm({
      show: true,
      questionId: id,
      questionText: questionText
    });
  };

  const confirmDeleteQuestion = () => {
    deleteMCQQuestion(showDeleteConfirm.questionId);
    setShowDeleteConfirm({
      show: false,
      questionId: '',
      questionText: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">MCQ Question Management</h2>
            <p className="text-gray-600">Create and manage multiple choice questions for assessment</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as 'all' | '9th' | '10th')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="9th">9th Grade</option>
              <option value="10th">10th Grade</option>
            </select>
            
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Plus size={20} />
              Add MCQ Question
            </button>
          </div>
        </div>
      </div>

      {/* Add Question Form */}
      {(isAddingQuestion || editingQuestion) && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingQuestion ? 'Edit MCQ Question' : 'Add New MCQ Question'}
            </h3>
            <button
              onClick={() => {
                if (editingQuestion) {
                  handleCancelEdit();
                } else {
                  setIsAddingQuestion(false);
                }
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                <select
                  value={newQuestion.class}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, class: e.target.value as '9th' | '10th' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="9th">9th Grade</option>
                  <option value="10th">10th Grade</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question *
              </label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Enter the question"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options *
              </label>
              <div className="space-y-3">
                {newQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="correctAnswer"
                      checked={newQuestion.correctAnswer === index}
                      onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                      className="text-purple-600"
                    />
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => handleOptionChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Select the radio button next to the correct answer
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  if (editingQuestion) {
                    handleCancelEdit();
                  } else {
                    setIsAddingQuestion(false);
                  }
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingQuestion ? handleUpdateQuestion : handleSaveQuestion}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Save size={16} />
                {editingQuestion ? 'Update Question' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Answer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuestions.map((question) => (
                <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">{question.question}</div>
                      <div className="text-sm text-gray-500 mt-1">
                        {question.options.map((opt, idx) => (
                          <div key={idx} className="truncate">
                            {String.fromCharCode(65 + idx)}. {opt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      question.class === '9th' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {question.class}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                      question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {question.difficulty}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {String.fromCharCode(65 + question.correctAnswer)}. {question.options[question.correctAnswer]}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {question.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-purple-600 hover:text-purple-800 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id, question.question)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No MCQ questions found for the selected class</p>
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="mt-2 text-purple-600 hover:text-purple-800 transition-colors"
            >
              Add your first MCQ question
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete MCQ Question
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete this MCQ question? 
                This action cannot be undone and will remove the question from all future exams.
              </p>
              
              <div className="bg-gray-50 p-3 rounded-lg mb-4 text-left">
                <p className="text-sm text-gray-700 font-medium">Question:</p>
                <p className="text-sm text-gray-600 mt-1 truncate">{showDeleteConfirm.questionText}</p>
              </div>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm({ show: false, questionId: '', questionText: '' })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteQuestion}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MCQManager;