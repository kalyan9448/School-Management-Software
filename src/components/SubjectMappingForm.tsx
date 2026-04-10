import { ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Teacher, teacherService, CurriculumTag } from '../utils/centralDataService';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { Check, ChevronDown } from 'lucide-react';

export interface SubjectMapping {
    id?: string;
    name: string;
    teacher: string;
    teacherEmail: string;
    periods: number;
    curriculumTags?: CurriculumTag[];
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
        teacherEmail?: string;
        periods: number;
        curriculumTags?: CurriculumTag[];
        originalId?: string;
    } | null;
    onSave: (data: { class: string; section: string; subject: string; teacher: string; teacherEmail: string; periods: number; curriculumTags: CurriculumTag[] }, originalId?: string) => void;
    onCancel: () => void;
}

export function SubjectMappingForm({ initialData, onSave, onCancel }: SubjectMappingFormProps) {
    const [formData, setFormData] = useState({
        class: initialData?.class || '',
        section: initialData?.section || '',
        subject: initialData?.subject || '',
        teacher: initialData?.teacher || '',
        teacherEmail: initialData?.teacherEmail || '',
        periods: initialData?.periods?.toString() || '',
        curriculumTags: initialData?.curriculumTags || [] as CurriculumTag[],
    });
    const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);

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
    const tagsList: CurriculumTag[] = [
        'CBSE',
        'State',
        'Montessori',
        'International',
        'Vedic',
        'Abacus',
        'Learning-by-Doing'
    ];

    const handleSave = () => {
        if (!formData.class || !formData.section || !formData.subject || !formData.teacher || !formData.periods) {
            alert('Please fill in all required fields.');
            return;
        }

        // If teacherEmail is missing, try to find it from the teachers list as a fallback
        let email = formData.teacherEmail;
        if (!email) {
            const selectedTeacher = teachers.find(t => t.name === formData.teacher);
            email = selectedTeacher?.email || '';
        }

        if (!email) {
            alert('Could not determine teacher email. Please re-select the teacher.');
            return;
        }

        onSave({
            class: formData.class,
            section: formData.section,
            subject: formData.subject,
            teacher: formData.teacher,
            teacherEmail: email,
            periods: parseInt(formData.periods, 10),
            curriculumTags: formData.curriculumTags,
        }, initialData?.originalId);
    };

    const toggleTag = (tag: CurriculumTag) => {
        const currentTags = [...formData.curriculumTags];
        const index = currentTags.indexOf(tag);
        if (index > -1) {
            currentTags.splice(index, 1);
        } else {
            currentTags.push(tag);
        }
        setFormData({ ...formData, curriculumTags: currentTags });
    };

    const toggleAllTags = () => {
        if (formData.curriculumTags.length === tagsList.length) {
            setFormData({ ...formData, curriculumTags: [] });
        } else {
            setFormData({ ...formData, curriculumTags: [...tagsList] });
        }
    };

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.tag-dropdown-container')) {
                setIsTagDropdownOpen(false);
            }
        };
        if (isTagDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isTagDropdownOpen]);

    return (
        <div className="p-8 bg-gray-50/50 min-h-screen">
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
                <div className="bg-white rounded-xl shadow-md border border-gray-200">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 rounded-t-xl">
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
                                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
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
                                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 transition-all"
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
                                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                                    onChange={(e) => {
                                        const teacherName = e.target.value;
                                        const selectedTeacher = teachers.find(t => t.name === teacherName);
                                        setFormData({ 
                                            ...formData, 
                                            teacher: teacherName,
                                            teacherEmail: selectedTeacher?.email || ''
                                        });
                                    }}
                                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
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
                                    className="w-full h-[42px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                    placeholder="e.g., 5"
                                />
                            </div>

                            {/* Curriculum Tags (Multi-select) */}
                            <div className="md:col-span-2 relative tag-dropdown-container">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tag (Optional)
                                </label>
                                <div 
                                    className={`w-full min-h-[42px] px-4 py-2 border rounded-lg cursor-pointer bg-white flex items-center justify-between gap-2 transition-all ${isTagDropdownOpen ? 'border-purple-500 ring-2 ring-purple-500/20 shadow-sm' : 'border-gray-300 hover:border-gray-400'}`}
                                    onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
                                >
                                    <div className="flex flex-wrap gap-1.5 items-center min-w-0">
                                        {formData.curriculumTags.length === 0 ? (
                                            <span className="text-gray-400 font-normal leading-none select-none">Select curriculum tags</span>
                                        ) : (
                                            formData.curriculumTags.map(tag => (
                                                <span key={tag} className="bg-purple-50 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded flex items-center border border-purple-100 whitespace-nowrap animate-in fade-in zoom-in-95 duration-200">
                                                    {tag}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform duration-300 ${isTagDropdownOpen ? 'rotate-180 text-purple-500' : ''}`} />
                                </div>

                                {isTagDropdownOpen && (
                                    <div className="absolute z-[100] mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] py-1.5 max-h-64 overflow-y-auto ring-1 ring-black/5 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div 
                                            className="px-4 py-2.5 hover:bg-purple-50 border-b border-gray-100 flex items-center justify-between cursor-pointer group transition-colors"
                                            onClick={toggleAllTags}
                                        >
                                            <span className={`text-sm font-semibold transition-colors ${formData.curriculumTags.length === tagsList.length ? 'text-purple-700' : 'text-gray-700'}`}>
                                                Select All
                                            </span>
                                            <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${formData.curriculumTags.length === tagsList.length ? 'bg-purple-600 border-purple-600 scale-105 shadow-sm' : 'border border-gray-300 group-hover:border-purple-400'}`}>
                                                {formData.curriculumTags.length === tagsList.length && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                            </div>
                                        </div>
                                        <div className="py-1">
                                            {tagsList.map(tag => (
                                                <div 
                                                    key={tag}
                                                    className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between cursor-pointer group transition-colors"
                                                    onClick={() => toggleTag(tag)}
                                                >
                                                    <span className={`text-sm tracking-wide transition-colors ${formData.curriculumTags.includes(tag) ? 'text-purple-800 font-medium' : 'text-gray-600 font-normal'}`}>
                                                        {tag}
                                                    </span>
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${formData.curriculumTags.includes(tag) ? 'bg-purple-600 border-purple-600 scale-105 shadow-sm' : 'border border-gray-300 group-hover:border-purple-400 shadow-inner'}`}>
                                                        {formData.curriculumTags.includes(tag) && <Check className="w-3 h-3 text-white stroke-[3px]" />}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
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
