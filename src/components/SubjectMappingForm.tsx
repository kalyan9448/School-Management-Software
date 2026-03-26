import { ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Teacher, teacherService } from '../utils/centralDataService';
import { useAcademicClasses } from '../hooks/useAcademicClasses';

export interface SubjectMapping {
    name: string;
    teacher: string;
    periods: number;
}

export interface ClassData {
    class: string;
    subjects: SubjectMapping[];
}

interface SubjectMappingFormProps {
    initialData?: {
        class: string;
        section: string;
        subject: string;
        teacher: string;
        periods: number;
        originalSubject?: string; // Used for editing an existing subject mapping
    } | null;
    onSave: (data: { class: string; section: string; subject: string; teacher: string; periods: number }, originalSubject?: string) => void;
    onCancel: () => void;
}

export function SubjectMappingForm({ initialData, onSave, onCancel }: SubjectMappingFormProps) {
    const [formData, setFormData] = useState({
        class: initialData?.class || '',
        section: initialData?.section || '',
        subject: initialData?.subject || '',
        teacher: initialData?.teacher || '',
        periods: initialData?.periods?.toString() || '',
    });

    const [teachers, setTeachers] = useState<Teacher[]>([]);

    useEffect(() => {
        const loadTeachers = async () => {
            try {
                const data = await teacherService.getAll();
                setTeachers(data);
            } catch (err) {
                console.error('Failed to load teachers:', err);
            }
        };
        loadTeachers();
    }, []);

    const { uniqueClasses: classes, sectionsForClass } = useAcademicClasses();
    const sections = sectionsForClass(formData.class);
    const subjectsList = [
        'English',
        'Mathematics',
        'Science',
        'Social Studies',
        'Environmental Science',
        'Hindi',
        'Physics',
        'Chemistry',
        'Biology',
        'Computer',
        'Art & Craft',
        'Music',
        'Physical Education',
        'Dance',
    ];

    const handleSave = () => {
        if (!formData.class || !formData.section || !formData.subject || !formData.teacher || !formData.periods) {
            alert('Please fill in all required fields.');
            return;
        }
        onSave({
            class: formData.class,
            section: formData.section,
            subject: formData.subject,
            teacher: formData.teacher,
            periods: parseInt(formData.periods, 10),
        }, initialData?.originalSubject);
    };

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button
                    onClick={onCancel}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-gray-900 mb-1">{initialData ? 'Edit Subject Mapping' : 'Add Subject Mapping'}</h1>
                    <p className="text-gray-600">
                        {initialData ? 'Update teacher allocation details' : 'Assign a teacher to a subject for a class'}
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-8 pb-24">
                {/* Mapping Form */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200 bg-gray-50">
                        <h2 className="text-lg font-semibold text-gray-900">Mapping Details</h2>
                    </div>
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Class */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Class *
                                </label>
                                <select
                                    value={formData.class}
                                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                                    disabled={!!initialData} // Cannot change class once mapped
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Select Class</option>
                                    {classes.map((cls) => (
                                        <option key={cls} value={cls}>{cls}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Section */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Section *
                                </label>
                                <select
                                    value={formData.section}
                                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                    disabled={!!initialData} // Cannot change section once mapped
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
                                >
                                    <option value="">Select Section</option>
                                    {sections.map((sec) => (
                                        <option key={sec} value={sec}>{sec}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Subject */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Subject *
                                </label>
                                <select
                                    value={formData.subject}
                                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Select Subject</option>
                                    {subjectsList.map((sub) => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Teacher */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Teacher *
                                </label>
                                <select
                                    value={formData.teacher}
                                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                >
                                    <option value="">Select Teacher</option>
                                    {teachers.map((teacher) => (
                                        <option key={teacher.id} value={teacher.name}>{teacher.name} ({teacher.subjects?.join(', ') || ''})</option>
                                    ))}
                                    {teachers.length === 0 && <option value="" disabled>No active teachers found</option>}
                                </select>
                                {teachers.length === 0 && (
                                    <p className="text-xs text-orange-600 mt-1">Please add teachers first in the Teachers module.</p>
                                )}
                            </div>

                            {/* Weekly Periods */}
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Weekly Periods *
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    value={formData.periods}
                                    onChange={(e) => setFormData({ ...formData, periods: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="e.g., 5"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="fixed bottom-0 left-0 lg:left-64 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
                <div className="max-w-4xl mx-auto flex justify-end gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 transition-all shadow-md font-medium"
                    >
                        <Save className="w-5 h-5" />
                        {initialData ? 'Update Mapping' : 'Save Mapping'}
                    </button>
                </div>
            </div>
        </div>
    );
}
