import { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths,
  startOfYear,
  endOfYear,
  eachMonthOfInterval,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Calendar as CalendarIcon, 
  Info, 
  X, 
  Trash2, 
  AlertTriangle,
  GraduationCap,
  Bell,
  Star
} from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { useAuth } from '../contexts/AuthContext';
import { calendarService, CalendarEvent, classService } from '../utils/centralDataService';

const EVENT_COLORS: Record<string, string> = {
  holiday: 'bg-red-500',
  exam: 'bg-orange-500',
  cultural: 'bg-blue-500',
  announcement: 'bg-purple-500',
  custom: 'bg-gray-500',
};

const EVENT_BORDER_COLORS: Record<string, string> = {
  holiday: 'border-red-200',
  exam: 'border-orange-200',
  cultural: 'border-blue-200',
  announcement: 'border-purple-200',
  custom: 'border-gray-200',
};

const EVENT_BG_LIGHT: Record<string, string> = {
  holiday: 'bg-red-50',
  exam: 'bg-orange-50',
  cultural: 'bg-blue-50',
  announcement: 'bg-purple-50',
  custom: 'bg-gray-50',
};

export function CalendarModule() {
  const { user } = useAuth();
  const [view, setView] = useState<'month' | 'year'>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    type: 'custom' as CalendarEvent['type'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    description: '',
    classIds: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allEvents, allClasses] = await Promise.all([
        calendarService.getAll(),
        classService.getAll()
      ]);
      setEvents(allEvents);
      
      // Deduplicate classes for selection
      const uniqueClasses = Array.from(new Set(allClasses.map(c => c.className)))
        .map(name => ({ id: name, name }));
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Failed to load calendar data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.title || !formData.startDate || !formData.endDate) {
      alert('Please fill in all required fields.');
      return;
    }

    try {
      const payload = {
        ...formData,
        school_id: user?.school_id || sessionStorage.getItem('active_school_id') || '',
      };

      if (editingEvent) {
        await calendarService.update(editingEvent.id, payload);
      } else {
        await calendarService.create(payload);
      }

      setShowAddModal(false);
      setEditingEvent(null);
      loadData();
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save event.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await calendarService.delete(id);
        loadData();
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  const getEventsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return events.filter(e => dateStr >= e.startDate && dateStr <= e.endDate);
  };

  const renderMonthGrid = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const allDays = eachDayOfInterval({
      start: startDate,
      end: endDate
    });

    return (
      <div className="grid grid-cols-7 border-l border-t border-gray-200 rounded-b-xl overflow-hidden shadow-sm bg-white">
        {allDays.map((day) => {
          const formattedDate = format(day, "d");
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isTodayDate = isToday(day);

          return (
            <div
              key={day.toString()}
              className={`min-h-[100px] md:min-h-[120px] p-2 border-r border-b border-gray-100 transition-colors hover:bg-gray-50 flex flex-col gap-1 ${
                !isCurrentMonth ? "bg-gray-50/50" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className={`text-xs md:text-sm font-bold rounded-xl w-7 h-7 flex items-center justify-center transition-all ${
                  isTodayDate ? "bg-purple-600 text-white shadow-md ring-4 ring-purple-100" : 
                  !isCurrentMonth ? "text-gray-300" : "text-gray-600"
                }`}>
                  {formattedDate}
                </span>
                {isTodayDate && (
                  <span className="text-[8px] font-black uppercase text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full border border-purple-100">Today</span>
                )}
              </div>
              <div className="flex flex-col gap-1 overflow-y-auto max-h-[70px] md:max-h-[85px] custom-scrollbar scrollbar-hide">
                {dayEvents.map(event => (
                  <button
                    key={event.id}
                    onClick={() => {
                      setEditingEvent(event);
                      setFormData({
                        title: event.title,
                        type: event.type,
                        startDate: event.startDate,
                        endDate: event.endDate,
                        description: event.description,
                        classIds: event.classIds || [],
                      });
                      setShowAddModal(true);
                    }}
                    className={`text-[9px] md:text-[10px] px-2 py-1 rounded-lg truncate text-left font-bold transition-all hover:scale-[1.02] active:scale-95 ${EVENT_COLORS[event.type]} text-white shadow-sm border border-black/5`}
                    title={`${event.title}: ${event.description}`}
                  >
                    {event.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearGrid = () => {
    const yearStart = startOfYear(currentDate);
    const months = eachMonthOfInterval({
        start: yearStart,
        end: endOfYear(currentDate)
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map(month => (
          <div key={month.toString()} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-3">
            <h4 className="font-bold text-gray-900 border-b pb-2">{format(month, 'MMMM yyyy')}</h4>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                <div key={d} className="text-[10px] text-center font-bold text-gray-400">{d}</div>
              ))}
              {eachDayOfInterval({
                start: startOfWeek(startOfMonth(month)),
                end: endOfWeek(endOfMonth(month))
              }).map(day => {
                const dayEvents = getEventsForDay(day);
                const hasHoliday = dayEvents.some(e => e.type === 'holiday');
                const hasExam = dayEvents.some(e => e.type === 'exam');
                const hasCultural = dayEvents.some(e => e.type === 'cultural');

                return (
                  <div 
                    key={day.toString()}
                    className={`text-[10px] h-6 flex items-center justify-center rounded-md relative ${
                      !isSameMonth(day, month) ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    {isSameMonth(day, month) && (
                        <>
                            <span className={`relative z-10 ${isToday(day) ? 'bg-purple-600 text-white w-5 h-5 flex items-center justify-center rounded-full shadow-sm' : ''}`}>
                                {format(day, 'd')}
                            </span>
                            {dayEvents.length > 0 && (
                                <div className="absolute inset-0 flex items-end justify-center pb-0.5 pointer-events-none">
                                    <div className="flex gap-px">
                                        {hasHoliday && <div className="w-1 h-1 rounded-full bg-red-500"></div>}
                                        {hasExam && <div className="w-1 h-1 rounded-full bg-orange-500"></div>}
                                        {hasCultural && <div className="w-1 h-1 rounded-full bg-blue-500"></div>}
                                        {dayEvents.some(e => ['announcement', 'custom'].includes(e.type)) && <div className="w-1 h-1 rounded-full bg-purple-500"></div>}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gray-100 rounded-xl p-1">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'month' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView('year')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                view === 'year' ? "bg-white text-purple-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Academic Year
            </button>
          </div>
          <div className="h-8 w-px bg-gray-200"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subMonths(currentDate, 12))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-gray-900 min-w-[150px] text-center">
              {view === 'month' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy')}
            </h3>
            <button
              onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addMonths(currentDate, 12))}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingEvent(null);
            setFormData({
              title: '',
              type: 'custom',
              startDate: format(new Date(), 'yyyy-MM-dd'),
              endDate: format(new Date(), 'yyyy-MM-dd'),
              description: '',
              classIds: [],
            });
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 shadow-md transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Add Event
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-visible">
        {view === 'month' ? (
          <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-7 bg-purple-600 text-white rounded-t-2xl py-3.5 shadow-lg border-b border-purple-500/20">
              {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                <div key={day} className="text-center font-black text-[10px] md:text-xs uppercase tracking-widest opacity-90">{day}</div>
              ))}
            </div>
            {renderMonthGrid()}
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderYearGrid()}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 py-4 px-6 bg-white rounded-2xl shadow-sm border border-gray-100">
        {Object.entries(EVENT_COLORS).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <span className="text-xs font-semibold text-gray-600 capitalize">{type}</span>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-xl font-black text-gray-900">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
                <p className="text-sm text-gray-500 font-medium tracking-tight">Schedule an academic event or holiday.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>

            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                    placeholder="e.g. Annual Sports Day"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Event Type</label>
                  <select
                    value={formData.type}
                    onChange={e => setFormData(f => ({ ...f, type: e.target.value as any }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                  >
                    <option value="cultural">Cultural</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam</option>
                    <option value="announcement">Announcement</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-gray-700">Applicable for (Optional)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, classIds: classes.map(c => c.id) }))}
                        className="text-[10px] font-bold uppercase tracking-wider text-purple-600 hover:text-purple-700 bg-purple-50 px-2 py-1 rounded-md transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData(f => ({ ...f, classIds: [] }))}
                        className="text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:text-gray-700 bg-gray-100 px-2 py-1 rounded-md transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 max-h-40 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {classes.map(c => (
                        <label key={c.id} className="flex items-center gap-2 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={formData.classIds.includes(c.id)}
                            onChange={e => {
                              const newIds = e.target.checked 
                                ? [...formData.classIds, c.id]
                                : formData.classIds.filter(id => id !== c.id);
                              setFormData(f => ({ ...f, classIds: newIds }));
                            }}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-gray-300 transition-all cursor-pointer"
                          />
                          <span className={`text-sm transition-colors ${formData.classIds.includes(c.id) ? 'text-purple-700 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>
                            {c.name}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  {formData.classIds.length === 0 && (
                    <p className="text-[10px] text-gray-400 mt-2 italic flex items-center gap-1">
                      <Info className="w-3 h-3" />
                      If none selected, event applies to all classes by default.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={e => setFormData(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={e => setFormData(f => ({ ...f, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 outline-none transition-all font-medium h-24 resize-none"
                    placeholder="Details about the event..."
                  />
                </div>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              {editingEvent ? (
                <button
                  onClick={() => handleDelete(editingEvent.id)}
                  className="flex items-center gap-2 px-5 py-2.5 text-red-600 hover:bg-red-50 rounded-2xl transition-all font-bold text-sm bg-white border border-red-100 shadow-sm overflow-hidden group relative"
                >
                  <div className="absolute inset-0 bg-red-600/0 group-hover:bg-red-600/5 transition-colors"></div>
                  <Trash2 className="w-4 h-4" />
                  Delete Event
                </button>
              ) : <div></div>}
              <div className="flex gap-4">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-6 py-2.5 text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-2xl transition-all font-bold text-sm"
                >
                  Discard
                </button>
                <button
                  onClick={handleCreateOrUpdate}
                  className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all font-bold text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
