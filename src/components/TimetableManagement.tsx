import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Clock, Users, BookOpen, AlertCircle, CheckCircle } from 'lucide-react';
import centralDataService, { TimetableSlot, DayOfWeek } from '../utils/centralDataService';
import { getClassSections, getUniqueClasses, getSectionsForClass } from '../utils/classUtils';

export function TimetableManagement() {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Available subjects and teachers for the selected class (from subject mappings)
    const [availableMappings, setAvailableMappings] = useState<{ subject: string, teacher: string, teacherEmail: string }[]>([]);

    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const periods = [
        { start: '09:00', end: '10:00', label: 'Period 1' },
        { start: '10:00', end: '11:00', label: 'Period 2' },
        { start: '11:00', end: '12:00', label: 'Period 3' },
        { start: '12:00', end: '13:00', label: 'Break' },
        { start: '13:00', end: '14:00', label: 'Period 4' },
        { start: '14:00', end: '15:00', label: 'Period 5' },
    ];

    const classes = getUniqueClasses();
    const sections = getSectionsForClass(selectedClass);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            loadTimetable();
            loadMappings();
        }
    }, [selectedClass, selectedSection]);

    const loadTimetable = () => {
        const slots = centralDataService.timetable.getByClass(selectedClass, selectedSection);
        setTimetableSlots(slots);
    };

    const loadMappings = () => {
        // Fetch subject-teacher mappings for this class from localStorage (matching SubjectMappingView logic)
        const storedMappings = localStorage.getItem('school_subject_mappings');
        if (storedMappings) {
            const allMappings = JSON.parse(storedMappings);
            const classMapping = allMappings.find((m: any) => m.class === `${selectedClass} ${selectedSection}`);
            if (classMapping) {
                // Map to our local available mappings structure
                // Note: SubjectMappingView stores teacher name, we need to find their email for teacherId
                const teachers = centralDataService.teacher.getAll();

                const mapped = classMapping.subjects.map((s: any) => {
                    const teacherObj = teachers.find(t => t.name === s.teacher);
                    return {
                        subject: s.name,
                        teacher: s.teacher,
                        teacherEmail: teacherObj?.email || ''
                    };
                });
                setAvailableMappings(mapped);
            } else {
                setAvailableMappings([]);
            }
        }
    };

    const handleCellChange = (day: DayOfWeek, startTime: string, endTime: string, mappingIndex: string) => {
        const mapping = availableMappings[parseInt(mappingIndex)];
        if (!mapping) return;

        // Check for teacher conflicts across ALL classes
        const allSlots = centralDataService.timetable.getAll();
        const conflict = allSlots.find(s =>
            s.teacherId === mapping.teacherEmail &&
            s.day === day &&
            s.startTime === startTime &&
            !(s.class === selectedClass && s.section === selectedSection)
        );

        if (conflict) {
            alert(`Conflict: ${mapping.teacher} is already assigned to ${conflict.class}-${conflict.section} on ${day} at ${startTime}.`);
            return;
        }

        const slotId = `${selectedClass}-${selectedSection}-${day}-${startTime}`;
        const newSlot: TimetableSlot = {
            id: slotId,
            classId: `${selectedClass}-${selectedSection}`, // Simplified
            class: selectedClass,
            section: selectedSection,
            day,
            startTime,
            endTime,
            subjectId: mapping.subject, // Using name as ID for now
            subject: mapping.subject,
            teacherId: mapping.teacherEmail,
            teacherName: mapping.teacher
        };

        setTimetableSlots(prev => {
            const filtered = prev.filter(s => !(s.day === day && s.startTime === startTime));
            return [...filtered, newSlot];
        });
    };

    const removeSlot = (day: DayOfWeek, startTime: string) => {
        setTimetableSlots(prev => prev.filter(s => !(s.day === day && s.startTime === startTime)));
    };

    const saveTimetable = () => {
        setIsSaving(true);
        try {
            // Get all timetable slots NOT belonging to this class/section
            const otherSlots = centralDataService.timetable.getAll().filter(s =>
                !(s.class === selectedClass && s.section === selectedSection)
            );

            // Combine with current class slots
            centralDataService.timetable.save([...otherSlots, ...timetableSlots]);

            setMessage({ type: 'success', text: 'Timetable saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to save timetable.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="w-48">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Class</label>
                        <select
                            value={selectedClass}
                            onChange={(e) => {
                                setSelectedClass(e.target.value);
                                setSelectedSection('');
                            }}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                            <option value="">Select Class</option>
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="w-32">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Section</label>
                        <select
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            disabled={!selectedClass}
                            className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                        >
                            <option value="">Section</option>
                            {sections.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {selectedClass && selectedSection && (
                    <button
                        onClick={saveTimetable}
                        disabled={isSaving}
                        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors shadow-sm font-medium"
                    >
                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Timetable</>}
                    </button>
                )}
            </div>

            {message && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                    {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    <p className="font-medium">{message.text}</p>
                </div>
            )}

            {!selectedClass || !selectedSection ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-gray-900 font-bold text-lg">Select a Class & Section</h3>
                    <p className="text-gray-500 mt-1">Choose a class to view and manage its weekly timetable.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 w-32">Period / Day</th>
                                    {days.map(day => (
                                        <th key={day} className="p-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider min-w-[150px]">
                                            {day}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {periods.map((period, pIdx) => (
                                    <tr key={pIdx} className={period.label === 'Break' ? 'bg-orange-50/50' : 'hover:bg-gray-50/50'}>
                                        <td className="p-4 border-r border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-900 font-bold italic">
                                                <Clock className="w-4 h-4 text-purple-600" />
                                                {period.label}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-medium ml-6">
                                                {period.start} - {period.end}
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const slot = timetableSlots.find(s => s.day === day && s.startTime === period.start);

                                            if (period.label === 'Break') {
                                                return <td key={day} className="p-4 text-center text-orange-400 font-medium text-xs uppercase tracking-widest">Interval</td>;
                                            }

                                            return (
                                                <td key={day} className="p-2 align-top">
                                                    {slot ? (
                                                        <div className="group relative bg-purple-50 border border-purple-200 rounded-lg p-3 hover:shadow-sm transition-all">
                                                            <button
                                                                onClick={() => removeSlot(day, period.start)}
                                                                className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-red-200 text-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <div className="text-sm font-bold text-purple-900 mb-1">{slot.subject}</div>
                                                            <div className="flex items-center gap-1.5 text-[11px] text-purple-700">
                                                                <Users className="w-3 h-3" />
                                                                {slot.teacherName}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full min-h-[60px] flex flex-col justify-center">
                                                            <select
                                                                onChange={(e) => handleCellChange(day, period.start, period.end, e.target.value)}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:text-gray-900 outline-none hover:border-purple-300 transition-colors"
                                                                value=""
                                                            >
                                                                <option value="">+ Assign</option>
                                                                {availableMappings.map((m, idx) => (
                                                                    <option key={idx} value={idx}>{m.subject} ({m.teacher})</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {selectedClass && selectedSection && availableMappings.length === 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                        <h4 className="text-blue-900 font-bold mb-1">No Subject Mappings Found</h4>
                        <p className="text-blue-800 text-sm">
                            You need to map subjects and teachers to this class in the <strong>Subject Mapping</strong> tab before you can assign them to the timetable.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
