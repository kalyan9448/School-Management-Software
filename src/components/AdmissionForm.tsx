import { useState } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon, FileText, Camera } from 'lucide-react';

interface AdmissionFormProps {
  student: any;
  onBack: () => void;
  onSave: (data: any) => void;
}

interface DocumentUpload {
  name: string;
  file: File | null;
  preview?: string;
}

export function AdmissionForm({ student, onBack, onSave }: AdmissionFormProps) {
  const [formData, setFormData] = useState({
    name: student?.name || '',
    dob: student?.dob || '',
    gender: student?.gender || 'Male',
    bloodGroup: student?.bloodGroup || '',
    parentName: student?.parentName || '',
    phone: student?.phone || '',
    email: student?.email || '',
    address: student?.address || '',
    classApplied: student?.classApplied || '',
    classAllotted: student?.classAllotted || '',
    status: student?.status || 'enquiry',
  });

  const [studentPhoto, setStudentPhoto] = useState<string | null>(student?.photo || null);

  const [documents, setDocuments] = useState<{
    birthCertificate: DocumentUpload;
    aadharCard: DocumentUpload;
    parentAadhar: DocumentUpload;
    vaccinationCard: DocumentUpload;
    passportPhoto: DocumentUpload;
    transferCertificate: DocumentUpload;
  }>({
    birthCertificate: { name: 'Birth Certificate', file: null },
    aadharCard: { name: 'Student Aadhar Card', file: null },
    parentAadhar: { name: 'Parent Aadhar Card', file: null },
    vaccinationCard: { name: 'Vaccination Card', file: null },
    passportPhoto: { name: 'Passport Size Photo', file: null },
    transferCertificate: { name: 'Transfer Certificate', file: null },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Documents are now optional as per user request

    onSave({
      ...formData,
      photo: studentPhoto,
      documents: documents,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setStudentPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDocumentUpload = (docType: keyof typeof documents, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocuments({
          ...documents,
          [docType]: {
            ...documents[docType],
            file: file,
            preview: reader.result as string,
          },
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeDocument = (docType: keyof typeof documents) => {
    setDocuments({
      ...documents,
      [docType]: {
        ...documents[docType],
        file: null,
        preview: undefined,
      },
    });
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <div>
          <h1 className="text-gray-900 mb-2">
            {student ? 'Edit Admission' : 'New Admission'}
          </h1>
          <p className="text-gray-600">Fill in the student details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Student Photo Upload */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Student Photo</h3>

          <div className="flex items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 mb-3">
                {studentPhoto ? (
                  <img src={studentPhoto} alt="Student" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-gray-400" />
                )}
              </div>
              <label className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                {studentPhoto ? 'Change Photo' : 'Upload Photo'}
              </label>
              {studentPhoto && (
                <button
                  type="button"
                  onClick={() => setStudentPhoto(null)}
                  className="mt-2 text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="flex-1">
              <p className="text-gray-700 mb-2">Photo Guidelines:</p>
              <ul className="text-gray-600 space-y-1 list-disc list-inside">
                <li>Passport size photo preferred</li>
                <li>Clear face visibility</li>
                <li>Plain background</li>
                <li>Recent photograph (within 6 months)</li>
                <li>Format: JPG, PNG (Max 2MB)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Student Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Student Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter student name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Date of Birth *</label>
              <input
                type="date"
                name="dob"
                value={formData.dob}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Gender *</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Blood Group *</label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parent Information */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Parent/Guardian Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Parent Name *</label>
              <input
                type="text"
                name="parentName"
                value={formData.parentName}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter parent/guardian name"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                required
                maxLength={10}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 9876543210"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Email ID</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="parent@email.com"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter address"
              />
            </div>
          </div>
        </div>

        {/* Admission Details */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Admission Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 mb-2">Class Applied For *</label>
              <select
                name="classApplied"
                value={formData.classApplied}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select Class</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>Class {num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Class Allotted</label>
              <select
                name="classAllotted"
                value={formData.classAllotted}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Not Allotted Yet</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                  <option key={num} value={num}>Class {num}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">Status *</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="enquiry">Enquiry</option>
                <option value="in-process">In Process</option>
                <option value="confirmed">Confirmed</option>
                <option value="admitted">Admitted</option>
              </select>
            </div>
          </div>
        </div>

        {/* Document Upload */}
        <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-gray-900 mb-4">Document Upload</h3>
          <p className="text-gray-600 mb-4">
            Please upload relevant documents. All document uploads are optional.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Birth Certificate */}
            <div>
              <label className="block text-gray-700 mb-2">
                Birth Certificate <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.birthCertificate.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.birthCertificate.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('birthCertificate')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('birthCertificate', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Aadhar Card */}
            <div>
              <label className="block text-gray-700 mb-2">
                Student Aadhar Card <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.aadharCard.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.aadharCard.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('aadharCard')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('aadharCard', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Parent Aadhar */}
            <div>
              <label className="block text-gray-700 mb-2">
                Parent Aadhar Card <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.parentAadhar.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.parentAadhar.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('parentAadhar')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('parentAadhar', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Vaccination Card */}
            <div>
              <label className="block text-gray-700 mb-2">
                Vaccination Card <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.vaccinationCard.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.vaccinationCard.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('vaccinationCard')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('vaccinationCard', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Passport Photo */}
            <div>
              <label className="block text-gray-700 mb-2">
                Passport Size Photo <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.passportPhoto.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.passportPhoto.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('passportPhoto')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDocumentUpload('passportPhoto', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Transfer Certificate - Optional */}
            <div>
              <label className="block text-gray-700 mb-2">
                Transfer Certificate <span className="text-gray-500">(Optional)</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors">
                {documents.transferCertificate.file ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{documents.transferCertificate.file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDocument('transferCertificate')}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-2">
                    <Upload className="w-8 h-8 text-gray-400" />
                    <span className="text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => handleDocumentUpload('transferCertificate', e)}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-blue-800">
              <strong>Note:</strong> Accepted formats: PDF, JPG, JPEG, PNG (Max 5MB per file)
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-2xl hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg shadow-purple-500/30"
          >
            {student ? 'Update Admission' : 'Create Admission'}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}