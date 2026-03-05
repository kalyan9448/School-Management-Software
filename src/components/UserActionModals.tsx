import { X } from 'lucide-react';

interface ViewUserModalProps {
  user: any;
  userType: 'teacher' | 'student' | 'parent' | null;
  onClose: () => void;
}

export function ViewUserModal({ user, userType, onClose }: ViewUserModalProps) {
  if (!user || !userType) return null;

  const renderTeacherDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Employee ID</p>
          <p className="text-gray-900">{user.employeeId}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Name</p>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Subject</p>
          <p className="text-gray-900">{user.subject}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Phone</p>
          <p className="text-gray-900">{user.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Email</p>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Joining Date</p>
          <p className="text-gray-900">{user.joiningDate}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
            {user.status}
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Assigned Classes</p>
          <p className="text-gray-900">{user.classes?.join(', ') || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  const renderStudentDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Admission No</p>
          <p className="text-gray-900">{user.admissionNo}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Student Name</p>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Class</p>
          <p className="text-gray-900">{user.class} - {user.section}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Date of Birth</p>
          <p className="text-gray-900">{user.dob || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Parent/Guardian</p>
          <p className="text-gray-900">{user.parent}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Contact Phone</p>
          <p className="text-gray-900">{user.phone}</p>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-600 mb-1">Address</p>
          <p className="text-gray-900">{user.address || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
            {user.status}
          </span>
        </div>
      </div>
    </div>
  );

  const renderParentDetails = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600 mb-1">Parent Name</p>
          <p className="text-gray-900">{user.name}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Relation</p>
          <p className="text-gray-900">{user.relation}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Student</p>
          <p className="text-gray-900">{user.student}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Class</p>
          <p className="text-gray-900">{user.class}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Phone</p>
          <p className="text-gray-900">{user.phone}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Email</p>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Occupation</p>
          <p className="text-gray-900">{user.occupation || 'N/A'}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-1">Status</p>
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm capitalize">
            {user.status}
          </span>
        </div>
        <div className="col-span-2">
          <p className="text-sm text-gray-600 mb-1">Address</p>
          <p className="text-gray-900">{user.address || 'N/A'}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h3 className="text-gray-900">
            {userType === 'teacher' ? 'Teacher Details' : userType === 'student' ? 'Student Details' : 'Parent Details'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          {userType === 'teacher' && renderTeacherDetails()}
          {userType === 'student' && renderStudentDetails()}
          {userType === 'parent' && renderParentDetails()}
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

interface DeleteConfirmationProps {
  user: any;
  userType: 'teacher' | 'student' | 'parent' | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmation({ user, userType, onConfirm, onCancel }: DeleteConfirmationProps) {
  if (!user || !userType) return null;

  const getUserTitle = () => {
    if (userType === 'teacher') return `Teacher: ${user.name}`;
    if (userType === 'student') return `Student: ${user.name}`;
    return `Parent: ${user.name}`;
  };

  const getUserId = () => {
    if (userType === 'teacher') return `Employee ID: ${user.employeeId}`;
    if (userType === 'student') return `Admission No: ${user.admissionNo}`;
    return `Phone: ${user.phone}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-6 h-6 text-red-600" />
          </div>
          <h3 className="text-center text-gray-900 mb-2">Delete {userType === 'teacher' ? 'Teacher' : userType === 'student' ? 'Student' : 'Parent'}?</h3>
          <p className="text-center text-gray-600 mb-4">
            Are you sure you want to delete this {userType}? This action cannot be undone.
          </p>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-gray-900 mb-1">{getUserTitle()}</p>
            <p className="text-gray-600 text-sm">{getUserId()}</p>
          </div>
        </div>
        <div className="bg-gray-50 px-6 py-4 flex gap-3 justify-end rounded-b-xl">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
