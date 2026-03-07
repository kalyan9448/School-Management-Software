import { useState, useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

interface Student {
  id: string;
  admissionNo: string;
  name: string;
  parentName: string;
  phone: string;
  classAllotted: string;
  status: 'enquiry' | 'in-process' | 'confirmed' | 'admitted';
  admissionDate?: string;
  activatedAt?: string;
}

export function AdmissionActivationView() {
  const [students, setStudents] = useState<Student[]>([]);

  // Load students from localStorage
  const loadStudents = () => {
    const localData = localStorage.getItem('admissions_demo_data');
    if (localData) {
      setStudents(JSON.parse(localData));
    }
  };

  useEffect(() => {
    loadStudents();

    // Listen for storage changes to sync across tabs/components
    window.addEventListener('storage', loadStudents);
    return () => window.removeEventListener('storage', loadStudents);
  }, []);

  const handleActivate = (id: string) => {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const activatedAt = new Date().toISOString().split('T')[0];
    const updatedStudents = students.map(s =>
      s.id === id ? { ...s, activatedAt } : s
    );

    setStudents(updatedStudents);
    localStorage.setItem('admissions_demo_data', JSON.stringify(updatedStudents));

    // Trigger storage event for other components in same tab
    window.dispatchEvent(new Event('storage'));

    alert(
      `Activation link sent to ${student.phone} for ${student.name}!\n\nThe parent will receive:\n- Login credentials\n- App download link\n- Activation instructions`
    );
  };

  const pendingActivations = students.filter(s =>
    (s.status === 'admitted' || s.status === 'confirmed') && !s.activatedAt
  );

  const recentlyActivated = students
    .filter(s => s.activatedAt)
    .sort((a, b) => (b.activatedAt || '').localeCompare(a.activatedAt || ''))
    .slice(0, 5);

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-gray-900">Admission Activation</h2>
        <p className="text-gray-600">Activate parent accounts for newly admitted students</p>
      </div>

      {/* Pending Activations */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-gray-900">Pending Activations</h3>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
            {pendingActivations.length} Pending
          </span>
        </div>

        {pendingActivations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            No pending activations found.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingActivations.map((student) => (
              <div
                key={student.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-gray-900 mb-1 font-medium">{student.name}</p>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                      <span>Class: {student.classAllotted}</span>
                      <span>Admission: {student.admissionDate || 'N/A'}</span>
                      <span>Parent: {student.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleActivate(student.id)}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Activate
                    </button>
                    <button
                      onClick={() => {
                        alert(
                          `Student Details:\n\nName: ${student.name}\nClass: ${student.classAllotted}\nAdmission Date: ${student.admissionDate || 'N/A'}\nParent Contact: ${student.phone}`
                        );
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Activation Flow */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-gray-900 mb-4">Activation Process</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              1
            </div>
            <p className="text-gray-900 mb-1">Add Student</p>
            <p className="text-gray-600 text-sm">Enter student details</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              2
            </div>
            <p className="text-gray-900 mb-1">Map Parent</p>
            <p className="text-gray-600 text-sm">Add parent phone</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              3
            </div>
            <p className="text-gray-900 mb-1">Send Activation</p>
            <p className="text-gray-600 text-sm">System sends link</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg text-center">
            <div className="w-12 h-12 bg-yellow-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 text-xl">
              4
            </div>
            <p className="text-gray-900 mb-1">Parent Verifies</p>
            <p className="text-gray-600 text-sm">Account activated</p>
          </div>
        </div>
      </div>

      {/* Recent Activations */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-gray-900">Recently Activated</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-gray-600 font-semibold">Student Name</th>
                <th className="px-6 py-3 text-left text-gray-600 font-semibold">Class</th>
                <th className="px-6 py-3 text-left text-gray-600 font-semibold">Parent</th>
                <th className="px-6 py-3 text-left text-gray-600 font-semibold">Activated On</th>
                <th className="px-6 py-3 text-left text-gray-600 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentlyActivated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 italic">
                    No recently activated accounts.
                  </td>
                </tr>
              ) : (
                recentlyActivated.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-gray-900 font-medium">{item.name}</td>
                    <td className="px-6 py-4 text-gray-700">{item.classAllotted}</td>
                    <td className="px-6 py-4 text-gray-700">{item.parentName}</td>
                    <td className="px-6 py-4 text-gray-700">{item.activatedAt}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
