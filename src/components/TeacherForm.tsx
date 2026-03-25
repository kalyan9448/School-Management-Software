import { useState } from 'react';
import { ArrowLeft, Upload, X, Image as ImageIcon, FileText, Camera } from 'lucide-react';
import { ClassMultiSelect } from './ClassMultiSelect';
import { SubjectMultiSelect } from './SubjectMultiSelect';
import { Teacher } from '../utils/centralDataService';

interface TeacherFormProps {
    teacher: Teacher | null;
    onBack: () => void;
    onSave: (data: Teacher) => void;
}

interface DocumentUpload {
    name: string;
    file: File | null;
    preview?: string;
}

export function TeacherForm({ teacher, onBack, onSave }: TeacherFormProps) {
    const [formData, setFormData] = useState({
        name: teacher?.name || '',
        dob: teacher?.dob || '',
        gender: teacher?.gender || 'Female',
        bloodGroup: teacher?.bloodGroup || '',
        phone: teacher?.phone || '',
        emergencyContact: teacher?.emergencyContact || '',
        email: teacher?.email || '',
        address: teacher?.address || '',
        employeeId: teacher?.employeeId || teacher?.id || '',
        subjects: teacher?.subjects || ((teacher as any)?.subject ? [(teacher as any).subject] : []),
        qualification: teacher?.qualification || '',
        experience: teacher?.experience || '',
        joiningDate: teacher?.joiningDate || new Date().toISOString().split('T')[0],
        status: teacher?.status || 'active',
    });

    const [selectedClasses, setSelectedClasses] = useState<string[]>(teacher?.classes || []);
    const [teacherPhoto, setTeacherPhoto] = useState<string | null>(teacher?.photo || null);

    const [documents, setDocuments] = useState<{
        resume: DocumentUpload;
        idProof: DocumentUpload;
        educationCertificates: DocumentUpload;
        experienceLetters: DocumentUpload;
    }>({
        resume: teacher?.documents?.resume || { name: 'Resume / CV', file: null },
        idProof: teacher?.documents?.idProof || { name: 'ID Proof (Aadhar/PAN)', file: null },
        educationCertificates: teacher?.documents?.educationCertificates || { name: 'Education Certificates', file: null },
        experienceLetters: teacher?.documents?.experienceLetters || { name: 'Experience Letters', file: null },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const teacherData: Teacher = {
            id: teacher?.id || Date.now().toString(),
            ...formData,
            classes: selectedClasses,
            photo: teacherPhoto,
            documents: documents,
        };

        onSave(teacherData);
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
                setTeacherPhoto(reader.result as string);
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
        <div className="p-8 pb-32">
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
                        {teacher ? 'Edit Teacher' : 'Add New Teacher'}
                    </h1>
                    <p className="text-gray-600">Fill in the teacher details</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Photo Upload */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-gray-900 mb-4">Profile Photo</h3>

                    <div className="flex items-start gap-6">
                        <div className="flex flex-col items-center">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden bg-gray-50 mb-3">
                                {teacherPhoto ? (
                                    <img src={teacherPhoto} alt="Teacher" className="w-full h-full object-cover" />
                                ) : (
                                    <Camera className="w-12 h-12 text-gray-400" />
                                )}
                            </div>
                            <label className="cursor-pointer px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                />
                                {teacherPhoto ? 'Change Photo' : 'Upload Photo'}
                            </label>
                            {teacherPhoto && (
                                <button
                                    type="button"
                                    onClick={() => setTeacherPhoto(null)}
                                    className="mt-2 text-red-600 hover:text-red-700"
                                >
                                    Remove
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-gray-700 mb-2">Photo Guidelines:</p>
                            <ul className="text-gray-600 space-y-1 list-disc list-inside">
                                <li>Professional passport size photo</li>
                                <li>Clear face visibility</li>
                                <li>Plain background</li>
                                <li>Recent photograph (within 6 months)</li>
                                <li>Format: JPG, PNG (Max 2MB)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Personal Details */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-gray-900 mb-4">Personal Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter full name"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Date of Birth</label>
                            <input
                                type="date"
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Gender *</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Blood Group</label>
                            <select
                                name="bloodGroup"
                                value={formData.bloodGroup}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-gray-900 mb-4">Contact Information</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Phone Number *</label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                required
                                maxLength={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., 9876543210"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Emergency Contact</label>
                            <input
                                type="tel"
                                name="emergencyContact"
                                value={formData.emergencyContact}
                                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                                maxLength={10}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., 9876543210"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Email Address *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="teacher@school.com"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Residential Address</label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="Enter full address"
                            />
                        </div>
                    </div>
                </div>

                {/* Professional Details */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
                    <h3 className="text-gray-900 mb-4">Professional Details</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-gray-700 mb-2">Employee ID {teacher && '(Read-only)'}</label>
                            <input
                                type="text"
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                readOnly={!!teacher}
                                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${teacher ? 'bg-gray-50 cursor-not-allowed' : ''}`}
                                placeholder="Auto-generated or enter manual"
                            />
                        </div>

                        <div>
                            <SubjectMultiSelect
                                value={formData.subjects}
                                onChange={(subjects) => setFormData({ ...formData, subjects })}
                                required
                            />
                        </div>

                        <div className="md:col-span-2">
                            <label className="block text-gray-700 mb-2">Classes Assigned *</label>
                            <ClassMultiSelect
                                value={selectedClasses}
                                onChange={(classes) => setSelectedClasses(classes)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Qualification *</label>
                            <input
                                type="text"
                                name="qualification"
                                value={formData.qualification}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="B.Ed, M.A."
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Experience *</label>
                            <input
                                type="text"
                                name="experience"
                                value={formData.experience}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                placeholder="e.g., 5 years"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Joining Date *</label>
                            <input
                                type="date"
                                name="joiningDate"
                                value={formData.joiningDate}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-gray-700 mb-2">Status *</label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="active">Active</option>
                                <option value="on-leave">On Leave</option>
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
                        {/* Resume */}
                        <div>
                            <label className="block text-gray-700 mb-2">
                                Resume / CV <span className="text-gray-500">(Optional)</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
                                {documents.resume.file ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="text-gray-700 truncate max-w-[200px]">{documents.resume.file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument('resume')}
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
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => handleDocumentUpload('resume', e)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* ID Proof */}
                        <div>
                            <label className="block text-gray-700 mb-2">
                                ID Proof (Aadhar/PAN) <span className="text-gray-500">(Optional)</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
                                {documents.idProof.file ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="text-gray-700 truncate max-w-[200px]">{documents.idProof.file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument('idProof')}
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
                                            onChange={(e) => handleDocumentUpload('idProof', e)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Education Certificates */}
                        <div>
                            <label className="block text-gray-700 mb-2">
                                Education Certificates <span className="text-gray-500">(Optional)</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
                                {documents.educationCertificates.file ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="text-gray-700 truncate max-w-[200px]">{documents.educationCertificates.file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument('educationCertificates')}
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
                                            accept=".pdf,.jpg,.jpeg,.png,.zip"
                                            onChange={(e) => handleDocumentUpload('educationCertificates', e)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* Experience Letters */}
                        <div>
                            <label className="block text-gray-700 mb-2">
                                Experience Letters <span className="text-gray-500">(Optional)</span>
                            </label>
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-purple-500 transition-colors">
                                {documents.experienceLetters.file ? (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-green-600" />
                                            <span className="text-gray-700 truncate max-w-[200px]">{documents.experienceLetters.file.name}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeDocument('experienceLetters')}
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
                                            accept=".pdf,.jpg,.jpeg,.png,.zip"
                                            onChange={(e) => handleDocumentUpload('experienceLetters', e)}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sticky Action Footer */}
                <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
                    <div className="max-w-7xl mx-auto flex items-center justify-end gap-4 px-4 sm:px-6 lg:px-8">
                        <button
                            type="button"
                            onClick={onBack}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 transition-colors shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none flex items-center gap-2"
                        >
                            Save Teacher
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
