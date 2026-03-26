import { useState, useEffect } from 'react';
import { AcademicYear } from '../utils/classUtils';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { Student } from './StudentInformationData';
import { studentService } from '../utils/centralDataService';
import { ArrowRight, Save, UserCheck, AlertTriangle } from 'lucide-react';

interface StudentPromotionToolProps {
    academicYears: AcademicYear[];
}

type PromotionAction = 'promote' | 'repeat' | 'transfer' | 'remove';

interface StudentPromotionState {
    studentId: string;
    action: PromotionAction;
    nextClass: string; // If promoted or repeated
    nextSection: string;
}

export function StudentPromotionTool({ academicYears }: StudentPromotionToolProps) {
    const [fromYear, setFromYear] = useState('');
    const [toYear, setToYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [promotionStates, setPromotionStates] = useState<Record<string, StudentPromotionState>>({});

    const { uniqueClasses, sectionsForClass } = useAcademicClasses();
    // Available classes dynamically fetched for the selected year plus alumni
    const classOrder = [...uniqueClasses, 'Alumni/Graduated'];

    useEffect(() => {
        if (fromYear && selectedClass) {
            const load = async () => {
                const allStudents = await studentService.getAll();
                const filtered = (allStudents as any[]).filter(
                    s => s.academicYear === fromYear && s.class === selectedClass
                );
                setStudents(filtered as Student[]);

                const initialStates: Record<string, StudentPromotionState> = {};
                const nextClassIndex = classOrder.indexOf(selectedClass) + 1;
                const defaultNextClass = nextClassIndex < classOrder.length ? classOrder[nextClassIndex] : 'Alumni/Graduated';

                filtered.forEach(student => {
                    initialStates[student.id] = {
                        studentId: student.id,
                        action: 'promote',
                        nextClass: defaultNextClass,
                        nextSection: student.section,
                    };
                });
                setPromotionStates(initialStates);
            };
            load();
        } else {
            setStudents([]);
        }
    }, [fromYear, selectedClass, classOrder]);

    const handleActionChange = (studentId: string, action: PromotionAction) => {
        setPromotionStates(prev => {
            const current = prev[studentId];
            let newNextClass = current.nextClass;

            if (action === 'repeat') {
                newNextClass = selectedClass;
            } else if (action === 'promote') {
                const nextClassIndex = classOrder.indexOf(selectedClass) + 1;
                const defaultNextClass = nextClassIndex < classOrder.length ? classOrder[nextClassIndex] : 'Alumni/Graduated';
                newNextClass = defaultNextClass;
            } else {
                newNextClass = ''; // NA for transfer/remove
            }

            return {
                ...prev,
                [studentId]: {
                    ...current,
                    action,
                    nextClass: newNextClass,
                }
            };
        });
    };

    const handleConfirmPromotion = async () => {
        if (!fromYear || !toYear) {
            alert("Please select both source and destination academic years.");
            return;
        }

        if (fromYear === toYear) {
            alert("Source and destination academic years cannot be the same.");
            return;
        }

        if (confirm(`Are you sure you want to process promotions for ${students.length} students to the ${toYear} academic year? This action will save historical records.`)) {
            for (const student of students) {
                const promotionUpdate = promotionStates[student.id];
                if (!promotionUpdate) continue;

                const updatedHistory = [...(student.academicHistory || [])];
                updatedHistory.push({
                    academicYear: student.academicYear || fromYear,
                    class: student.class,
                    section: student.section,
                    status: promotionUpdate.action === 'promote' ? 'promoted' : promotionUpdate.action === 'repeat' ? 'repeated' : promotionUpdate.action === 'transfer' ? 'transferred' : 'removed'
                });

                if (promotionUpdate.action === 'promote' || promotionUpdate.action === 'repeat') {
                    await studentService.update(student.id, {
                        academicYear: toYear,
                        class: promotionUpdate.nextClass,
                        section: promotionUpdate.nextClass === 'Alumni/Graduated' ? '' : promotionUpdate.nextSection,
                        academicHistory: updatedHistory,
                    } as any);
                } else {
                    await studentService.update(student.id, {
                        academicHistory: updatedHistory,
                    } as any);
                }
            }

            alert('Promotions processed successfully!');
            setFromYear('');
            setSelectedClass('');
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Student Promotion Configuration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">From Academic Year</label>
                        <select
                            value={fromYear}
                            onChange={e => setFromYear(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    <div className="hidden md:flex justify-center mb-2">
                        <ArrowRight className="w-6 h-6 text-gray-400" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Academic Year</label>
                        <select
                            value={toYear}
                            onChange={e => setToYear(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class to Promote</label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white shadow-sm"
                        >
                            <option value="">Select Class</option>
                            {classOrder.filter(c => c !== 'Alumni/Graduated').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {fromYear && selectedClass && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5 text-gray-600" />
                            <h4 className="font-semibold text-gray-900">Review Students</h4>
                        </div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                            {students.length} Students
                        </span>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 flex flex-col items-center">
                            <AlertTriangle className="w-12 h-12 text-gray-300 mb-3" />
                            <p>No students found for this class in the selected academic year.</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-gray-200">
                                            <th className="p-4 text-sm font-semibold text-gray-600">Admission No</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Student Name</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Current Sec</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600 w-48">Action</th>
                                            <th className="p-4 text-sm font-semibold text-gray-600">Next Class</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {students.map(student => {
                                            const state = promotionStates[student.id];
                                            if (!state) return null;
                                            const nextSections = sectionsForClass(state.nextClass);

                                            return (
                                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-4 text-sm font-medium text-gray-900">{student.admissionNo}</td>
                                                    <td className="p-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm text-gray-600">{student.section}</td>
                                                    <td className="p-4">
                                                        <select
                                                            value={state.action}
                                                            onChange={(e) => handleActionChange(student.id, e.target.value as PromotionAction)}
                                                            className={`w-full px-3 py-1.5 text-sm rounded border focus:ring-2 focus:outline-none ${state.action === 'promote' ? 'bg-green-50 border-green-200 text-green-700 focus:ring-green-500' :
                                                                state.action === 'repeat' ? 'bg-yellow-50 border-yellow-200 text-yellow-700 focus:ring-yellow-500' :
                                                                    'bg-red-50 border-red-200 text-red-700 focus:ring-red-500'
                                                                }`}
                                                        >
                                                            <option value="promote">Promote to Next Class</option>
                                                            <option value="repeat">Repeat Current Class</option>
                                                            <option value="transfer">Transfer to Other School</option>
                                                            <option value="remove">Remove from School</option>
                                                        </select>
                                                    </td>
                                                    <td className="p-4">
                                                        {(state.action === 'promote' || state.action === 'repeat') ? (
                                                            state.nextClass === 'Alumni/Graduated' ? (
                                                                <span className="text-sm font-medium text-gray-900">Alumni/Graduated</span>
                                                            ) : nextSections.length === 0 ? (
                                                                <div className="flex items-center gap-2 text-sm text-amber-700">
                                                                    <span className="font-medium text-gray-900">{state.nextClass}</span>
                                                                    <span className="text-gray-400">|</span>
                                                                    <span>No sections configured</span>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-sm font-medium text-gray-900">{state.nextClass}</span>
                                                                    <span className="text-gray-400">|</span>
                                                                    <select
                                                                        value={nextSections.includes(state.nextSection) ? state.nextSection : nextSections[0] || ''}
                                                                        onChange={(e) => setPromotionStates(prev => ({ ...prev, [student.id]: { ...state, nextSection: e.target.value } }))}
                                                                        className="text-sm border-gray-300 rounded py-1 px-2 focus:ring-blue-500"
                                                                    >
                                                                        {nextSections.map(section => (
                                                                            <option key={section} value={section}>Sec {section}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                            )
                                                        ) : (
                                                            <span className="text-sm text-gray-400 italic">Not Applicable</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                                <button
                                    onClick={handleConfirmPromotion}
                                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 shadow-md transition-all font-medium"
                                >
                                    <Save className="w-5 h-5" />
                                    Confirm Promotion
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
