import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Eye, EyeOff, Code } from 'lucide-react';
import { useExam } from '../context/ExamContext';
import { Question, TestCase } from '../types/Question';

function QuestionManager() {
  const { questions, addQuestion, updateQuestion, deleteQuestion } = useExam();
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<'all' | '9th' | '10th'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    questionId: string;
    questionTitle: string;
  }>({
    show: false,
    questionId: '',
    questionTitle: ''
  });

  const [newQuestion, setNewQuestion] = useState<Omit<Question, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    class: '9th',
    difficulty: 'Easy',
    sampleInput: '',
    sampleOutput: '',
    testCases: [
      { id: '1', input: '', expectedOutput: '', isHidden: false }
    ]
  });

  const [editingQuestionData, setEditingQuestionData] = useState<Question | null>(null);
  const filteredQuestions = questions.filter(q => 
    classFilter === 'all' || q.class === classFilter
  );

  const handleAddTestCase = () => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: [
        ...prev.testCases,
        { 
          id: (prev.testCases.length + 1).toString(), 
          input: '', 
          expectedOutput: '', 
          isHidden: false 
        }
      ]
    }));
  };

  const handleRemoveTestCase = (index: number) => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const handleTestCaseChange = (index: number, field: keyof TestCase, value: string | boolean) => {
    setNewQuestion(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) => 
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  const handleSaveQuestion = () => {
    if (!newQuestion.title.trim() || !newQuestion.description.trim()) {
      alert('Please fill in the question title and description');
      return;
    }

    if (newQuestion.testCases.length === 0) {
      alert('Please add at least one test case');
      return;
    }

    addQuestion(newQuestion);
    setIsAddingQuestion(false);
    setNewQuestion({
      title: '',
      description: '',
      class: '9th',
      difficulty: 'Easy',
      sampleInput: '',
      sampleOutput: '',
      testCases: [
        { id: '1', input: '', expectedOutput: '', isHidden: false }
      ]
    });
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestionData(question);
    setEditingQuestion(question.id);
    setNewQuestion({
      title: question.title,
      description: question.description,
      class: question.class,
      difficulty: question.difficulty,
      sampleInput: question.sampleInput || '',
      sampleOutput: question.sampleOutput || '',
      testCases: question.testCases
    });
  };

  const handleUpdateQuestion = () => {
    if (!editingQuestionData || !newQuestion.title.trim() || !newQuestion.description.trim()) {
      alert('Please fill in the question title and description');
      return;
    }

    if (newQuestion.testCases.length === 0) {
      alert('Please add at least one test case');
      return;
    }

    updateQuestion(editingQuestionData.id, newQuestion);
    setEditingQuestion(null);
    setEditingQuestionData(null);
    setNewQuestion({
      title: '',
      description: '',
      class: '9th',
      difficulty: 'Easy',
      sampleInput: '',
      sampleOutput: '',
      testCases: [
        { id: '1', input: '', expectedOutput: '', isHidden: false }
      ]
    });
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditingQuestionData(null);
    setNewQuestion({
      title: '',
      description: '',
      class: '9th',
      difficulty: 'Easy',
      sampleInput: '',
      sampleOutput: '',
      testCases: [
        { id: '1', input: '', expectedOutput: '', isHidden: false }
      ]
    });
  };

  const handleDeleteQuestion = (id: string, title: string) => {
    setShowDeleteConfirm({
      show: true,
      questionId: id,
      questionTitle: title
    });
  };

  const confirmDeleteQuestion = () => {
    deleteQuestion(showDeleteConfirm.questionId);
    setShowDeleteConfirm({
      show: false,
      questionId: '',
      questionTitle: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Question Bank Management</h2>
            <p className="text-gray-600">Create and manage exam questions for different classes</p>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value as 'all' | '9th' | '10th')}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Classes</option>
              <option value="8th">8th Grade</option>
              <option value="9th">9th Grade</option>
              <option value="10th">10th Grade</option>
            </select>
            
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Question
            </button>
          </div>
        </div>
      </div>

      {/* Add Question Form */}
      {(isAddingQuestion || editingQuestion) && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">
              {editingQuestion ? 'Edit Question' : 'Add New Question'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question Title *
                </label>
                <input
                  type="text"
                  value={newQuestion.title}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter question title"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
                  <select
                    value={newQuestion.class}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, class: e.target.value as '9th' | '10th' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="8th">8th Grade</option>
                    <option value="9th">9th Grade</option>
                    <option value="10th">10th Grade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={newQuestion.difficulty}
                    onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Description *
              </label>
              <textarea
                value={newQuestion.description}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Describe the problem statement"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Input</label>
                <textarea
                  value={newQuestion.sampleInput}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, sampleInput: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Example input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sample Output</label>
                <textarea
                  value={newQuestion.sampleOutput}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, sampleOutput: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Expected output"
                />
              </div>
            </div>

            {/* Test Cases */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">Test Cases *</label>
                <button
                  onClick={handleAddTestCase}
                  className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Plus size={16} />
                  Add Test Case
                </button>
              </div>

              <div className="space-y-3">
                {newQuestion.testCases.map((testCase, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Test Case {index + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleTestCaseChange(index, 'isHidden', !testCase.isHidden)}
                          className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                            testCase.isHidden 
                              ? 'bg-gray-100 text-gray-600' 
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          {testCase.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                          {testCase.isHidden ? 'Hidden' : 'Visible'}
                        </button>
                        {newQuestion.testCases.length > 1 && (
                          <button
                            onClick={() => handleRemoveTestCase(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Input</label>
                        <textarea
                          value={testCase.input}
                          onChange={(e) => handleTestCaseChange(index, 'input', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Test input"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Expected Output</label>
                        <textarea
                          value={testCase.expectedOutput}
                          onChange={(e) => handleTestCaseChange(index, 'expectedOutput', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Expected output"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  Test Cases
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
                    <div>
                      <div className="font-medium text-gray-900">{question.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {question.description}
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
                    {question.testCases.length} cases
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {question.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditQuestion(question)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteQuestion(question.id, question.title)}
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
            <Plus className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No questions found for the selected class</p>
            <button
              onClick={() => setIsAddingQuestion(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              Add your first question
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
                Delete Question
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete "<strong>{showDeleteConfirm.questionTitle}</strong>"? 
                This action cannot be undone and will remove the question from all future exams.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm({ show: false, questionId: '', questionTitle: '' })}
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

export default QuestionManager;