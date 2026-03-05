import { CheckCircle } from 'lucide-react';

export function AdmissionActivationView() {
  const pendingActivations = [
    {
      id: '1',
      name: 'Aarav Patel',
      class: 'Nursery A',
      admissionDate: '2024-02-15',
      parentPhone: '+91 98765 43210',
    },
    {
      id: '2',
      name: 'Diya Sharma',
      class: 'LKG A',
      admissionDate: '2024-02-16',
      parentPhone: '+91 98765 43211',
    },
    {
      id: '3',
      name: 'Arjun Singh',
      class: 'UKG A',
      admissionDate: '2024-02-17',
      parentPhone: '+91 98765 43212',
    },
    {
      id: '4',
      name: 'Sanya Gupta',
      class: 'Nursery B',
      admissionDate: '2024-02-18',
      parentPhone: '+91 98765 43213',
    },
    {
      id: '5',
      name: 'Rohan Kumar',
      class: 'LKG B',
      admissionDate: '2024-02-19',
      parentPhone: '+91 98765 43214',
    },
  ];

  const recentlyActivated = [
    { name: 'Sanya Gupta', class: 'Nursery B', parent: 'Mrs. Gupta', date: '2024-02-14' },
    { name: 'Rohan Kumar', class: 'LKG A', parent: 'Mr. Kumar', date: '2024-02-13' },
    { name: 'Priya Singh', class: 'UKG A', parent: 'Mrs. Singh', date: '2024-02-12' },
  ];

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
        <div className="space-y-3">
          {pendingActivations.map((student) => (
            <div
              key={student.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-900 mb-1">{student.name}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>Class: {student.class}</span>
                    <span>Admission: {student.admissionDate}</span>
                    <span>Parent: {student.parentPhone}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      alert(
                        `Activation link sent to ${student.parentPhone} for ${student.name}!\n\nThe parent will receive:\n- Login credentials\n- App download link\n- Activation instructions`
                      );
                    }}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Activate
                  </button>
                  <button
                    onClick={() => {
                      alert(
                        `Student Details:\n\nName: ${student.name}\nClass: ${student.class}\nAdmission Date: ${student.admissionDate}\nParent Contact: ${student.parentPhone}`
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
                <th className="px-6 py-3 text-left text-gray-600">Student Name</th>
                <th className="px-6 py-3 text-left text-gray-600">Class</th>
                <th className="px-6 py-3 text-left text-gray-600">Parent</th>
                <th className="px-6 py-3 text-left text-gray-600">Activated On</th>
                <th className="px-6 py-3 text-left text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentlyActivated.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-gray-700">{item.class}</td>
                  <td className="px-6 py-4 text-gray-700">{item.parent}</td>
                  <td className="px-6 py-4 text-gray-700">{item.date}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      <CheckCircle className="w-3 h-3" />
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
