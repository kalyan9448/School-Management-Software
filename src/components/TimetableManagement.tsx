import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Clock, Users, BookOpen, AlertCircle, CheckCircle, Settings, X } from 'lucide-react';
import { timetableService, subjectService, teacherService, subjectMappingService, academicYearService, schoolSettingsService, TimetableSlot, DayOfWeek } from '../utils/centralDataService';
import { PeriodDefinition } from '../types';
import { useAcademicClasses } from '../hooks/useAcademicClasses';
import { useAuth } from '../contexts/AuthContext';

export function TimetableManagement() {
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [timetableSlots, setTimetableSlots] = useState<TimetableSlot[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPeriodModal, setShowPeriodModal] = useState(false);
    const { user } = useAuth();

    // Periods configuration
    const [periodDefinitions, setPeriodDefinitions] = useState<PeriodDefinition[]>([
        { id: 'p1', label: 'Period 1', startTime: '09:00', endTime: '10:00', type: 'period' },
        { id: 'p2', label: 'Period 2', startTime: '10:00', endTime: '11:00', type: 'period' },
        { id: 'p3', label: 'Period 3', startTime: '11:00', endTime: '12:00', type: 'period' },
        { id: 'break', label: 'Break', startTime: '12:00', endTime: '13:00', type: 'break' },
        { id: 'p4', label: 'Period 4', startTime: '13:00', endTime: '14:00', type: 'period' },
        { id: 'p5', label: 'Period 5', startTime: '14:00', endTime: '15:00', type: 'period' },
    ]);
    const [tempPeriods, setTempPeriods] = useState<PeriodDefinition[]>([]);
    const [settingsId, setSettingsId] = useState<string | null>(null);
    const [availableMappings, setAvailableMappings] = useState<{ subject: string, teacher: string, teacherEmail: string }[]>([]);

    const days: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const { uniqueClasses: classes, sectionsForClass } = useAcademicClasses();
    const sections = sectionsForClass(selectedClass);

    useEffect(() => {
        loadPeriods();
    }, []);

    useEffect(() => {
        if (selectedClass && selectedSection) {
            const loadData = async () => {
                setIsLoading(true);
                await loadTimetable();
                await loadMappings();
                setIsLoading(false);
            };
            loadData();
        }
    }, [selectedClass, selectedSection]);

    const loadPeriods = async () => {
        const schoolId = user?.school_id || sessionStorage.getItem('active_school_id') || '';
        try {
            const settings = await schoolSettingsService.getBySchool(schoolId);
            if (settings) {
                setSettingsId(settings.id);
                if (settings.periods && settings.periods.length > 0) {
                    setPeriodDefinitions(settings.periods);
                }
            }
        } catch (error) {
            console.error('Failed to load periods:', error);
        }
    };

    const loadTimetable = async () => {
        const slots = await timetableService.getByClass(selectedClass, selectedSection);
        setTimetableSlots(slots);
    };

    const loadMappings = async () => {
        const schoolId = user?.school_id || sessionStorage.getItem('active_school_id') || '';
        const activeYear = await academicYearService.getCurrent(schoolId);
        
        // Fetch all subject-teacher mappings for this school and active year
        const mappings = await subjectMappingService.getAll(schoolId, activeYear?.id);

        // Also fetch all teachers to build a name→email lookup
        const allTeachers = await teacherService.getAll();
        const teacherEmailByName: Record<string, string> = {};
        for (const t of allTeachers) {
            if (t.name && t.email) {
                teacherEmailByName[t.name.toLowerCase()] = t.email;
            }
        }

        // Filter mappings specifically for the selected class and section
        const filtered = mappings.filter(m => 
            m.className === selectedClass && m.section === selectedSection
        );

        const mapped = filtered.map(m => {
            // Resolve teacher email: use mapping's teacherEmail first,
            // then look up by teacher name in the teachers collection.
            let email = m.teacherEmail || '';
            if (!email && m.teacherName) {
                email = teacherEmailByName[m.teacherName.toLowerCase()] || '';
            }
            return {
                subject: m.subjectName,
                teacher: m.teacherName,
                teacherEmail: email,
            };
        });

        // Warn about any mappings with missing teacher emails so admins can fix them.
        const missing = mapped.filter(m => !m.teacherEmail);
        if (missing.length > 0) {
            console.warn('[TimetableManagement] These subject mappings have no teacher email:', missing.map(m => `${m.subject} (${m.teacher})`));
        }
        
        setAvailableMappings(mapped);
    };

    const handleCellChange = async (day: DayOfWeek, startTime: string, endTime: string, mappingIndex: string) => {
        const mapping = availableMappings[parseInt(mappingIndex)];
        if (!mapping) return;

        // Check for teacher conflicts across ALL classes
        const allSlots = await timetableService.getAll();
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

    const saveTimetable = async () => {
        setIsSaving(true);
        try {
            // Get all timetable slots NOT belonging to this class/section
            const allSlots = await timetableService.getAll();
            const otherSlots = allSlots.filter(s =>
                !(s.class === selectedClass && s.section === selectedSection)
            );

            // Build name→email lookup from teachers collection to fix any
            // old slots that stored teacher name instead of email in teacherId
            const allTeachers = await teacherService.getAll();
            const emailByName: Record<string, string> = {};
            for (const t of allTeachers) {
                if (t.name && t.email) emailByName[t.name.toLowerCase()] = t.email;
            }

            // Auto-fix teacherId: if it's not an email (no '@'), look up the email
            const fixTeacherId = (slot: TimetableSlot): TimetableSlot => {
                if (slot.teacherId && !slot.teacherId.includes('@')) {
                    const resolved = emailByName[slot.teacherId.toLowerCase()];
                    if (resolved) {
                        return { ...slot, teacherId: resolved };
                    }
                }
                return slot;
            };

            const fixedOther = otherSlots.map(fixTeacherId);
            const fixedCurrent = timetableSlots.map(fixTeacherId);

            // Combine with current class slots and save
            await timetableService.save([...fixedOther, ...fixedCurrent]);

            setMessage({ type: 'success', text: 'Timetable saved successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save timetable:', error);
            setMessage({ type: 'error', text: 'Failed to save timetable.' });
        } finally {
            setIsSaving(false);
        }
    };

    const savePeriods = async () => {
        const schoolId = user?.school_id || sessionStorage.getItem('active_school_id') || '';
        try {
            if (settingsId) {
                await schoolSettingsService.update(settingsId, { periods: tempPeriods });
            } else {
                const activeYear = await academicYearService.getCurrent(schoolId);
                const newSettings = await schoolSettingsService.create({
                    school_id: schoolId,
                    academicYear: activeYear?.name || '',
                    periods: tempPeriods
                });
                setSettingsId(newSettings.id);
            }
            setPeriodDefinitions(tempPeriods);
            setShowPeriodModal(false);
            setMessage({ type: 'success', text: 'Period times updated successfully!' });
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            console.error('Failed to save periods:', error);
            alert('Failed to save periods');
        }
    };

    const addPeriod = () => {
        const newPeriod: PeriodDefinition = {
            id: `p-${Date.now()}`,
            label: `New Period`,
            startTime: '00:00',
            endTime: '00:00',
            type: 'period'
        };
        setTempPeriods([...tempPeriods, newPeriod]);
    };

    const removePeriod = (id: string) => {
        setTempPeriods(tempPeriods.filter(p => p.id !== id));
    };

    const updateTempPeriod = (id: string, updates: Partial<PeriodDefinition>) => {
        setTempPeriods(tempPeriods.map(p => p.id === id ? { ...p, ...updates } : p));
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

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            setTempPeriods([...periodDefinitions]);
                            setShowPeriodModal(true);
                        }}
                        className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                    >
                        <Settings className="w-4 h-4" /> Manage Periods
                    </button>

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
                                {periodDefinitions.map((period, pIdx) => (
                                    <tr key={pIdx} className={period.type === 'break' ? 'bg-orange-50/50' : 'hover:bg-gray-50/50'}>
                                        <td className="p-4 border-r border-gray-200">
                                            <div className="flex items-center gap-2 text-gray-900 font-bold italic">
                                                <Clock className="w-4 h-4 text-purple-600" />
                                                {period.label}
                                            </div>
                                            <div className="text-[10px] text-gray-500 font-medium ml-6">
                                                {period.startTime} - {period.endTime}
                                            </div>
                                        </td>
                                        {days.map(day => {
                                            const slot = timetableSlots.find(s => s.day === day && s.startTime === period.startTime);
 
                                            if (period.type === 'break') {
                                                return <td key={day} className="p-4 text-center text-orange-400 font-medium text-xs uppercase tracking-widest">Interval</td>;
                                            }
 
                                            return (
                                                <td key={day} className="p-2 align-top">
                                                    {slot ? (
                                                        <div className="group relative bg-purple-50 border border-purple-200 rounded-lg p-3 hover:shadow-sm transition-all">
                                                            <button
                                                                onClick={() => removeSlot(day, period.startTime)}
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
                                                                onChange={(e) => handleCellChange(day, period.startTime, period.endTime, e.target.value)}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-xs text-gray-400 focus:text-gray-900 outline-none hover:border-purple-300 transition-colors"
                                                                value=""
                                                            >
                                                                <option value="">+ Assign</option>
                                                                {availableMappings.map((m: { subject: string, teacher: string }, idx: number) => (
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

            {/* Manage Periods Modal */}
            {showPeriodModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Manage Timetable Periods</h3>
                                <p className="text-sm text-gray-500 mt-1">Define the period names and time slots for the school.</p>
                            </div>
                            <button onClick={() => setShowPeriodModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            <div className="space-y-3">
                                <div 
                                    className="flex gap-4 text-xs font-bold text-gray-400 uppercase tracking-wider px-4 mb-2"
                                    style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr 1fr 1fr' }}
                                >
                                    <div>Label</div>
                                    <div>Start Time</div>
                                    <div>End Time</div>
                                    <div className="text-center">Type</div>
                                    <div className="text-right">Action</div>
                                </div>
                                
                                {tempPeriods.map((p: PeriodDefinition, idx: number) => (
                                    <div 
                                        key={p.id} 
                                        className="gap-4 items-center bg-gray-50 p-2 rounded-xl border border-gray-100"
                                        style={{ display: 'grid', gridTemplateColumns: '4fr 3fr 3fr 1fr 1fr' }}
                                    >
                                        <div>
                                            <input
                                                type="text"
                                                value={p.label}
                                                onChange={(e) => updateTempPeriod(p.id, { label: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="time"
                                                value={p.startTime}
                                                onChange={(e) => updateTempPeriod(p.id, { startTime: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <div>
                                            <input
                                                type="time"
                                                value={p.endTime}
                                                onChange={(e) => updateTempPeriod(p.id, { endTime: e.target.value })}
                                                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <button
                                                onClick={() => updateTempPeriod(p.id, { type: p.type === 'period' ? 'break' : 'period' })}
                                                className={`p-2 rounded-lg transition-colors ${p.type === 'break' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}
                                                title={p.type === 'period' ? 'Change to Break' : 'Change to Period'}
                                            >
                                                {p.type === 'period' ? <Clock className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <div className="flex justify-end">
                                            <button onClick={() => removePeriod(p.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={addPeriod}
                                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-purple-600 hover:border-purple-200 hover:bg-purple-50 transition-all flex items-center justify-center gap-2 font-medium"
                                >
                                    <Plus className="w-4 h-4" /> Add Another Period
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                            <button
                                onClick={() => setShowPeriodModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition-colors font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={savePeriods}
                                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all font-medium flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" /> Save Period Configurations
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
