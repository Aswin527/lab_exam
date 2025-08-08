import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Users, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useExam } from '../context/ExamContext';
import { Student } from '../types/Question';
import * as XLSX from 'xlsx';

function StudentManager() {
  const { students, addStudent, updateStudent, deleteStudent } = useExam();
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<'all' | '9th' | '10th'>('all');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    success: number;
    errors: string[];
    duplicates: number;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    show: boolean;
    studentId: string;
    studentName: string;
  }>({
    show: false,
    studentId: '',
    studentName: ''
  });

  const [newStudent, setNewStudent] = useState<Omit<Student, 'id' | 'createdAt'>>({
    name: '',
    rollNumber: '',
    class: '9th',
    section: 'A'
  });

  const filteredStudents = students.filter(s => 
    classFilter === 'all' || s.class === classFilter
  );

  const handleBulkUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      let successCount = 0;
      let duplicateCount = 0;
      const errors: string[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)
        
        try {
          // Validate required fields
          if (!row.Name || !row.RollNumber || !row.Class || !row.Section) {
            errors.push(`Row ${rowNumber}: Missing required fields (Name, RollNumber, Class, Section)`);
            return;
          }

          // Validate class
          if (!['8th','9th', '10th'].includes(row.Class)) {
            errors.push(`Row ${rowNumber}: Invalid class "${row.Class}". Must be "8th","9th" or "10th"`);
            return;
          }

          // Validate section
          if (!['A', 'B', 'C', 'D'].includes(row.Section)) {
            errors.push(`Row ${rowNumber}: Invalid section "${row.Section}". Must be A, B, C, or D`);
            return;
          }

          // Check for duplicate roll number
          const existingStudent = students.find(s => s.rollNumber === row.RollNumber);
          if (existingStudent) {
            duplicateCount++;
            errors.push(`Row ${rowNumber}: Student with roll number "${row.RollNumber}" already exists`);
            return;
          }

          // Add student
          const studentData = {
            name: row.Name.toString().trim(),
            rollNumber: row.RollNumber.toString().trim(),
            class: row.Class as '9th' | '10th',
            section: row.Section.toString().trim()
          };

          addStudent(studentData);
          successCount++;

        } catch (error) {
          errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      });

      setUploadResults({
        success: successCount,
        errors,
        duplicates: duplicateCount
      });

    } catch (error) {
      setUploadResults({
        success: 0,
        errors: ['Failed to read Excel file. Please ensure it\'s a valid .xlsx or .xls file.'],
        duplicates: 0
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        Name: 'John Doe',
        RollNumber: '9A001',
        Class: '9th',
        Section: 'A'
      },
      {
        Name: 'Jane Smith',
        RollNumber: '10B002',
        Class: '10th',
        Section: 'B'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    
    // Set column widths
    worksheet['!cols'] = [
      { width: 20 }, // Name
      { width: 15 }, // RollNumber
      { width: 10 }, // Class
      { width: 10 }  // Section
    ];

    XLSX.writeFile(workbook, 'student_upload_template.xlsx');
  };

  const handleSaveStudent = () => {
    if (!newStudent.name.trim() || !newStudent.rollNumber.trim()) {
      alert('Please fill in all required fields (Name and Roll Number)');
      return;
    }

    // Check for duplicate roll number
    const existingStudent = students.find(s => s.rollNumber === newStudent.rollNumber);
    if (existingStudent) {
      alert('A student with this roll number already exists');
      return;
    }

    addStudent(newStudent);
    setIsAddingStudent(false);
    setNewStudent({
      name: '',
      rollNumber: '',
      class: '9th',
      section: 'A'
    });
  };

  const handleDeleteStudent = (id: string, name: string) => {
    setShowDeleteConfirm({
      show: true,
      studentId: id,
      studentName: name
    });
  };

  const confirmDeleteStudent = () => {
    deleteStudent(showDeleteConfirm.studentId);
    setShowDeleteConfirm({
      show: false,
      studentId: '',
      studentName: ''
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Student Management</h2>
            <p className="text-gray-600">Manage student records for exam participation</p>
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
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download size={20} />
              Download Template
            </button>
            
            <div className="relative">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleBulkUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isUploading}
              />
              <button
                disabled={isUploading}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  isUploading
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700'
                }`}
              >
                {isUploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Bulk Upload
                  </>
                )}
              </button>
            </div>
            
            <button
              onClick={() => setIsAddingStudent(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Student
            </button>
          </div>
        </div>
      </div>

      {/* Upload Results */}
      {uploadResults && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileSpreadsheet className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Upload Results</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{uploadResults.success}</div>
              <div className="text-sm text-green-700">Students Added</div>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{uploadResults.duplicates}</div>
              <div className="text-sm text-yellow-700">Duplicates Skipped</div>
            </div>
            
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">{uploadResults.errors.length}</div>
              <div className="text-sm text-red-700">Errors</div>
            </div>
          </div>
          
          {uploadResults.errors.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-800 mb-2">Errors:</h4>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {uploadResults.errors.map((error, index) => (
                  <div key={index} className="text-sm text-red-700 mb-1">
                    • {error}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={() => setUploadResults(null)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* Add Student Form */}
      {isAddingStudent && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-800">Add New Student</h3>
            <button
              onClick={() => setIsAddingStudent(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student Name *
              </label>
              <input
                type="text"
                value={newStudent.name}
                onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number *
              </label>
              <input
                type="text"
                value={newStudent.rollNumber}
                onChange={(e) => setNewStudent(prev => ({ ...prev, rollNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter roll number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
              <select
                value={newStudent.class}
                onChange={(e) => setNewStudent(prev => ({ ...prev, class: e.target.value as '9th' | '10th' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="9th">9th Grade</option>
                <option value="10th">10th Grade</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <select
                value={newStudent.section}
                onChange={(e) => setNewStudent(prev => ({ ...prev, section: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
                <option value="C">Section C</option>
                <option value="D">Section D</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setIsAddingStudent(false)}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveStudent}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Save size={16} />
              Save Student
            </button>
          </div>
        </div>
      )}

      {/* Students List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Total Students: <span className="font-semibold text-blue-600">{filteredStudents.length}</span>
            </div>
            <div className="text-xs text-gray-500">
              💡 Use "Download Template" to get the Excel format for bulk upload
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student Name
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
                  Added On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{student.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {student.rollNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      student.class === '9th' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {student.class}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      Section {student.section}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {student.createdAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingStudent(student.id)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id, student.name)}
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

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto text-gray-400 mb-3" size={48} />
            <p className="text-gray-500">No students found for the selected class</p>
            <button
              onClick={() => setIsAddingStudent(true)}
              className="mt-2 text-blue-600 hover:text-blue-800 transition-colors"
            >
              Add your first student
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
                Delete Student
              </h3>
              
              <p className="text-sm text-gray-500 mb-6">
                Are you sure you want to delete <strong>{showDeleteConfirm.studentName}</strong>? 
                This action cannot be undone and will remove all associated exam records.
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm({ show: false, studentId: '', studentName: '' })}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteStudent}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManager;