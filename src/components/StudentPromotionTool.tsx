import { useState, useEffect, useMemo } from 'react';
import { AcademicYear } from '../utils/classUtils';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { Student } from './StudentInformationData';
import { studentService, userService } from '../utils/centralDataService';
import { ArrowRight, Save, UserCheck, AlertTriangle } from 'lucide-react';

interface StudentPromotionToolProps {
    academicYears: AcademicYear[];
}

interface PromotionState {
    studentId: string;
    action: 'promote' | 'repeat' | 'transfer' | 'remove';
    nextClass: string;
    nextSection: string;
    nextRollNo: string;
}

export function StudentPromotionTool({ academicYears }: StudentPromotionToolProps) {
    const [fromYear, setFromYear] = useState('');
    const [toYear, setToYear] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [students, setStudents] = useState<Student[]>([]);
    const [promotionStates, setPromotionStates] = useState<Record<string, PromotionState>>({});

    const { uniqueClasses, sectionsForClass } = useAcademicClasses();
    const classOrder = useMemo(() => [...uniqueClasses, 'Alumni/Graduated'], [uniqueClasses]);

    useEffect(() => {
        if (fromYear && selectedClass) {
            const load = async () => {
                const allStudents = await studentService.getAll();
                const filtered = (allStudents as any[]).filter(
                    s => s.academicYear === fromYear && s.class === selectedClass
                );
                setStudents(filtered as Student[]);

                const initialStates: Record<string, PromotionState> = {};
                const nextClassIndex = classOrder.indexOf(selectedClass) + 1;
                const defaultNextClass = nextClassIndex < classOrder.length ? classOrder[nextClassIndex] : 'Alumni/Graduated';

                filtered.forEach(student => {
                    initialStates[student.id] = {
                        studentId: student.id,
                        action: 'promote',
                        nextClass: defaultNextClass,
                        nextSection: student.section,
                        nextRollNo: student.rollNo || '',
                    };
                });
                setPromotionStates(initialStates);
            };
            load();
        } else {
            setStudents([]);
        }
    }, [fromYear, selectedClass, classOrder]);

    const handleActionChange = (studentId: string, updates: Partial<PromotionState>) => {
        setPromotionStates(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], ...updates }
        }));
    };

    const [isProcessing, setIsProcessing] = useState(false);

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
            setIsProcessing(true);
            try {
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
                        const updatedStudent = {
                            ...student,
                            academicYear: toYear,
                            class: promotionUpdate.nextClass,
                            section: promotionUpdate.nextClass === 'Alumni/Graduated' ? '' : promotionUpdate.nextSection,
                            rollNo: promotionUpdate.nextRollNo,
                            academicHistory: updatedHistory,
                        } as Student;

                        await studentService.update(student.id, {
                            academicYear: toYear,
                            class: promotionUpdate.nextClass,
                            section: promotionUpdate.nextClass === 'Alumni/Graduated' ? '' : promotionUpdate.nextSection,
                            rollNo: promotionUpdate.nextRollNo,
                            academicHistory: updatedHistory,
                        } as any);

                        await userService.syncStudentToUser(updatedStudent);
                    } else {
                        await studentService.update(student.id, {
                            academicHistory: updatedHistory,
                        } as any);
                    }
                }

                alert('Promotions processed successfully!');
                setFromYear('');
                setSelectedClass('');
            } catch (error: any) {
                console.error("Promotion failed:", error);
                alert("An error occurred during promotion: " + error.message);
            } finally {
                setIsProcessing(false);
            }
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                        </select>
                    </div>
                    <div className="hidden md:flex justify-center mb-2"><ArrowRight className="w-6 h-6 text-gray-400" /></div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">To Academic Year</label>
                        <select
                            value={toYear}
                            onChange={e => setToYear(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Year</option>
                            {academicYears.map(y => <option key={y.id} value={y.name}>{y.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Class to Promote</label>
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        <div className="flex items-center gap-2"><UserCheck className="w-5 h-5 text-gray-600" /><h4 className="font-semibold text-gray-900">Review Students</h4></div>
                        <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{students.length} Students</span>
                    </div>

                    {students.length === 0 ? (
                        <div className="p-8 text-center text-gray-500"><AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" /><p>No students found.</p></div>
                    ) : (<>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white border-b border-gray-200">
                                        <th className="p-4 text-sm font-semibold text-gray-600">Student Info</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600">Current</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600">Action</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600">Target Class/Sec</th>
                                        <th className="p-4 text-sm font-semibold text-gray-600">Target Roll No</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {students.map(student => {
                                        const state = promotionStates[student.id];
                                        if (!state) return null;
                                        const nextSections = sectionsForClass(state.nextClass);

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="p-4">
                                                    <div className="text-sm font-semibold text-gray-900">{student.name}</div>
                                                    <div className="text-xs text-gray-500">{student.admissionNo}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="text-xs font-medium text-gray-600">
                                                        {student.class}-{student.section}
                                                    </div>
                                                    <div className="text-xs text-gray-400">Roll: {student.rollNo}</div>
                                                </td>
                                                <td className="p-4">
                                                    <select
                                                        value={state.action}
                                                        onChange={(e) => handleActionChange(student.id, { action: e.target.value as any })}
                                                        className="text-xs border-gray-300 rounded p-1.5 focus:ring-purple-500"
                                                    >
                                                        <option value="promote">Promote</option>
                                                        <option value="repeat">Repeat</option>
                                                        <option value="transfer">Transfer</option>
                                                        <option value="remove">Remove</option>
                                                    </select>
                                                </td>
                                                <td className="p-4">
                                                    {(state.action === 'promote' || state.action === 'repeat') ? (
                                                        <div className="flex items-center gap-2">
                                                            <select
                                                                value={state.nextClass}
                                                                onChange={(e) => handleActionChange(student.id, { nextClass: e.target.value })}
                                                                className="text-xs border-gray-300 rounded p-1.5 focus:ring-purple-500"
                                                            >
                                                                {classOrder.map(c => <option key={c} value={c}>{c}</option>)}
                                                            </select>
                                                            {state.nextClass !== 'Alumni/Graduated' && (
                                                                <select
                                                                    value={state.nextSection}
                                                                    onChange={(e) => handleActionChange(student.id, { nextSection: e.target.value })}
                                                                    className="text-xs border-gray-300 rounded p-1.5 focus:ring-purple-500"
                                                                >
                                                                    {nextSections.map(s => <option key={s} value={s}>Sec {s}</option>)}
                                                                </select>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">N/A</span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {(state.action === 'promote' || state.action === 'repeat') ? (
                                                        <input
                                                            type="text"
                                                            value={state.nextRollNo}
                                                            onChange={(e) => handleActionChange(student.id, { nextRollNo: e.target.value })}
                                                            placeholder="Roll No"
                                                            className="w-20 text-xs border-gray-300 rounded p-1.5 focus:ring-purple-500"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={handleConfirmPromotion}
                                disabled={isProcessing}
                                className={`flex items-center gap-2 px-8 py-3 text-white rounded-xl shadow-lg transition-all font-semibold ${
                                    isProcessing 
                                    ? 'bg-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 hover:scale-[1.02] active:scale-95'
                                }`}
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        Processing Batch...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        Complete Promotion
                                    </>
                                )}
                            </button>
                        </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
