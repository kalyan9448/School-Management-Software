import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  User,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle,
  Bell,
  X,
  Filter,
  BookMarked,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { type CalendarEvent } from "@/data/studentMockData";
import { CalendarService } from "@/services/student/studentDataService";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
const toDateStr = (d: Date) => d.toISOString().split("T")[0];

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const formatShortDate = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "short", day: "numeric" });

// ─────────────────────────────────────────────────────────────────────────────
// Event helpers
// ─────────────────────────────────────────────────────────────────────────────
const EVENT_TYPES = ["all", "class", "homework", "exam", "assignment", "event"] as const;
type EventTypeFilter = (typeof EVENT_TYPES)[number];

const getEventIcon = (type: string) => {
  switch (type) {
    case "class": return BookOpen;
    case "homework": return BookMarked;
    case "exam": return GraduationCap;
    case "assignment": return FileText;
    case "event": return CalendarIcon;
    default: return Bell;
  }
};

const getEventBadgeColor = (type: string) => {
  switch (type) {
    case "class": return "bg-blue-100 text-blue-700 border-blue-200";
    case "homework": return "bg-purple-100 text-purple-700 border-purple-200";
    case "exam": return "bg-red-100 text-red-700 border-red-200";
    case "assignment": return "bg-orange-100 text-orange-700 border-orange-200";
    case "event": return "bg-violet-100 text-violet-700 border-violet-200";
    default: return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const TYPE_LABEL: Record<string, string> = {
  all: "All", class: "Classes", homework: "Homework",
  exam: "Exams", assignment: "Assignments", event: "Events",
};

const TYPE_DOT_COLOR: Record<string, string> = {
  class: "#3b82f6", homework: "#a855f7", exam: "#ef4444",
  assignment: "#f59e0b", event: "#8b5cf6",
};

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function SchedulePage() {
  const navigate = useNavigate();
  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Dynamic data from localStorage
  const [calendarEvents] = useState<CalendarEvent[]>(() => CalendarService.getAll());

  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [currentDate, setCurrentDate] = useState(today);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activeFilter, setActiveFilter] = useState<EventTypeFilter>("all");
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // ── Date navigation ──────────────────────────────────────────────────────
  const navigate_ = (dir: -1 | 1) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      if (viewMode === "month") d.setMonth(d.getMonth() + dir);
      else if (viewMode === "week") d.setDate(d.getDate() + dir * 7);
      else d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const goToToday = () => { setCurrentDate(today); setSelectedDate(today); };

  // ── Calendar helpers ─────────────────────────────────────────────────────
  const getDaysInMonth = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();

  const getFirstDayOfMonth = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), 1).getDay();

  const getWeekDates = (d: Date): Date[] => {
    const start = new Date(d);
    start.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
  };

  const weekDates = getWeekDates(currentDate);

  const getDisplayTitle = () => {
    if (viewMode === "month") {
      return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    }
    if (viewMode === "week") {
      const s = weekDates[0], e = weekDates[6];
      return s.getMonth() === e.getMonth()
        ? `${s.toLocaleString("default", { month: "long" })} ${s.getDate()}–${e.getDate()}, ${s.getFullYear()}`
        : `${formatShortDate(s)} – ${formatShortDate(e)}, ${s.getFullYear()}`;
    }
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric",
    });
  };

  // ── Event queries ────────────────────────────────────────────────────────
  const getEventsForDate = (d: Date): CalendarEvent[] => {
    const str = toDateStr(d);
    return calendarEvents
      .filter(e => e.date === str)
      .filter(e => activeFilter === "all" || e.type === activeFilter)
      .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  };

  const hasEvents = (d: Date) => calendarEvents.some(e => e.date === toDateStr(d));

  const getEventsAtTime = (d: Date, time: string): CalendarEvent[] =>
    getEventsForDate(d).filter(e => e.startTime?.startsWith(time.substring(0, 2)));

  // Active date for day-panel: selectedDate → currentDate → today
  const focusDate = selectedDate ?? currentDate;
  const focusEvents = getEventsForDate(focusDate);
  const isFocusToday = isSameDay(focusDate, today);

  // ── Upcoming events (next 7 days from today) ─────────────────────────────
  const upcomingEvents = useMemo(() => {
    const end = new Date(today);
    end.setDate(today.getDate() + 7);
    return calendarEvents
      .filter(e => {
        const d = new Date(e.date + "T00:00:00");
        return d >= today && d <= end;
      })
      .filter(e => activeFilter === "all" || e.type === activeFilter)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || "").localeCompare(b.startTime || ""))
      .slice(0, 8);
  }, [today, activeFilter]);

  // ── Dynamic week stats ───────────────────────────────────────────────────
  const weekStats = useMemo(() => {
    const eventsThisWeek = weekDates.flatMap(d => calendarEvents.filter(e => e.date === toDateStr(d)));
    return {
      classes: eventsThisWeek.filter(e => e.type === "class").length,
      assignments: eventsThisWeek.filter(e => e.type === "assignment" || e.type === "homework").length,
      exams: eventsThisWeek.filter(e => e.type === "exam").length,
      events: eventsThisWeek.filter(e => e.type === "event").length,
    };
  }, [weekDates]);

  // ── Calendar day grid ────────────────────────────────────────────────────
  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < getFirstDayOfMonth(currentDate); i++) days.push(null);
    for (let d = 1; d <= getDaysInMonth(currentDate); d++) days.push(d);
    return days;
  }, [currentDate]);

  const timeSlots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00", "18:00",
  ];

  // ── Event detail modal ───────────────────────────────────────────────────
  const EventModal = ({ event, onClose }: { event: CalendarEvent; onClose: () => void }) => {
    const Icon = getEventIcon(event.type);
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.96 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Colour header */}
            <div className="p-6 text-white" style={{ background: `linear-gradient(135deg, ${event.color}ee, ${event.color})` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-white/70 capitalize">{event.type}</p>
                    <h3 className="font-bold text-lg leading-tight">{event.title}</h3>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm text-[#7A869A]">
                <CalendarIcon className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-[#1A1A1A]">
                  {new Date(event.date + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long", month: "long", day: "numeric", year: "numeric",
                  })}
                </span>
              </div>
              {event.startTime && (
                <div className="flex items-center gap-2 text-sm text-[#7A869A]">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-[#1A1A1A]">
                    {event.startTime}{event.endTime && ` – ${event.endTime}`}
                  </span>
                </div>
              )}
              {event.teacher && (
                <div className="flex items-center gap-2 text-sm text-[#7A869A]">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-[#1A1A1A]">{event.teacher}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-2 text-sm text-[#7A869A]">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-[#1A1A1A]">{event.location}</span>
                </div>
              )}
              {event.description && (
                <div className="p-3 bg-[#FAFBFF] rounded-xl border border-[#E6ECF5]">
                  <p className="text-sm text-[#7A869A]">{event.description}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-2">
                  {event.priority === "high" && (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" /> High Priority
                    </Badge>
                  )}
                  {event.completed && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" /> Completed
                    </Badge>
                  )}
                </div>
                {event.actionUrl && (
                  <Button
                    size="sm"
                    className="bg-blue-600 text-white hover:bg-blue-700"
                    onClick={() => { navigate(event.actionUrl!); onClose(); }}
                  >
                    Open
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* ── Header ── */}
      <div 
        className="text-white p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-lg"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-extraBold tracking-tight">Schedule</h1>
              <p className="text-white/70 text-sm mt-1">
                {today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-white hover:bg-white/10 border border-white/20"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Today
              </Button>
            </div>
          </div>

          {/* Quick stats grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[
              { label: "Classes", value: weekStats.classes, icon: BookOpen, color: "bg-blue-500/20" },
              { label: "Homework", value: weekStats.assignments, icon: BookMarked, color: "bg-purple-500/20" },
              { label: "Exams", value: weekStats.exams, icon: GraduationCap, color: "bg-red-500/20" },
              { label: "Events", value: weekStats.events, icon: CalendarIcon, color: "bg-violet-500/20" },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className={`${color} rounded-2xl p-4 text-center backdrop-blur-sm border border-white/10`}>
                <Icon className="w-4 h-4 mx-auto mb-1 text-white/80" />
                <div className="text-xl font-black text-white">{value}</div>
                <div className="text-[10px] uppercase font-bold tracking-wider text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filter bar */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1 scrollbar-hide">
          {EVENT_TYPES.map(type => (
            <button
              key={type}
              onClick={() => setActiveFilter(type)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold border transition-all shadow-sm ${activeFilter === type
                ? "bg-blue-600 text-white border-blue-600 ring-2 ring-blue-100"
                : "bg-white text-gray-500 border-gray-100 hover:border-blue-200 hover:text-blue-600"
                }`}
            >
              {type !== "all" && (
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_DOT_COLOR[type] }} />
              )}
              {type === "all" && <Filter className="w-3 h-3" />}
              {TYPE_LABEL[type]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main Calendar ── */}
          <div className="space-y-6" style={{ gridColumn: 'span 2 / span 2' }}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="p-6">
                {/* Calendar header */}
                <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => navigate_(-1)} className="border-[#E6ECF5] w-8 h-8 md:w-10 md:h-10">
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <h2 className="text-base md:text-lg font-bold text-[#1A1A1A] min-w-[140px] md:min-w-[220px] text-center">{getDisplayTitle()}</h2>
                    <Button variant="outline" size="icon" onClick={() => navigate_(1)} className="border-[#E6ECF5] w-8 h-8 md:w-10 md:h-10">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-1.5">
                    {(["month", "week", "day"] as const).map(mode => (
                      <Button
                        key={mode}
                        variant={viewMode === mode ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode(mode)}
                        className={viewMode === mode ? "text-white border-transparent" : "border-[#E6ECF5] text-gray-700 bg-white"}
                        style={viewMode === mode ? { backgroundColor: '#1F6FEB' } : {}}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* ── MONTH VIEW ── */}
                {viewMode === "month" && (
                  <div>
                    <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
                        <div key={d} className="text-center text-xs font-semibold text-[#7A869A] py-2">{d}</div>
                      ))}
                    </div>
                    <div className="grid gap-1" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>
                      {calendarDays.map((day, idx) => {
                        if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const isToday_ = isSameDay(date, today);
                        const isSelected = selectedDate && isSameDay(date, selectedDate);
                        const dayEvents = calendarEvents.filter(e => e.date === toDateStr(date));
                        const filteredDay = activeFilter === "all"
                          ? dayEvents
                          : dayEvents.filter(e => e.type === activeFilter);

                        return (
                          <motion.button
                            key={day}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              setSelectedDate(date);
                              setCurrentDate(date);
                              setViewMode("day");
                            }}
                            className={`aspect-square rounded-xl border-2 flex flex-col items-center justify-center relative transition-all ${isToday_
                              ? "bg-blue-600 text-white border-blue-600 shadow-md"
                              : isSelected
                                ? "bg-blue-50 border-[#1F6FEB]"
                                : filteredDay.length > 0
                                  ? "bg-blue-50/70 border-blue-200 hover:bg-blue-100"
                                  : "border-[#E6ECF5] hover:bg-gray-50"
                              }`}
                          >
                            <span className={`text-sm font-semibold ${isToday_ ? "text-white" : "text-[#1A1A1A]"}`}>
                              {day}
                            </span>
                            {filteredDay.length > 0 && !isToday_ && (
                              <div className="absolute bottom-1 flex gap-0.5 flex-wrap justify-center max-w-[80%]">
                                {filteredDay.slice(0, 3).map((ev, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ev.color }} />
                                ))}
                                {filteredDay.length > 3 && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                                )}
                              </div>
                            )}
                            {isToday_ && filteredDay.length > 0 && (
                              <div className="absolute bottom-1 flex gap-0.5">
                                {filteredDay.slice(0, 3).map((_, i) => (
                                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/60" />
                                ))}
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── WEEK VIEW ── */}
                {viewMode === "week" && (
                  <div className="overflow-x-auto">
                    <div className="min-w-[700px]">
                      <div className="grid gap-1 mb-2" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                        <div className="text-xs font-semibold text-[#7A869A] py-2 text-center">Time</div>
                        {weekDates.map(date => {
                          const isTod = isSameDay(date, today);
                          const dayEvCount = calendarEvents.filter(e => e.date === toDateStr(date)).length;
                          return (
                            <button
                              key={date.toISOString()}
                              onClick={() => { setSelectedDate(date); setCurrentDate(date); setViewMode("day"); }}
                              className={`text-center py-2 rounded-xl transition-all hover:opacity-80 ${isTod ? "bg-blue-600 text-white shadow-sm" : "text-gray-500 hover:bg-blue-50"}`}
                            >
                              <div className="text-xs font-semibold">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </div>
                              <div className={`text-lg font-bold ${isTod ? "text-white" : "text-[#1A1A1A]"}`}>
                                {date.getDate()}
                              </div>
                              {dayEvCount > 0 && (
                                <div className={`text-xs ${isTod ? "text-white/70" : "text-[#7A869A]"}`}>
                                  {dayEvCount} events
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                      <div className="border-t border-[#E6ECF5]">
                        {timeSlots.map(time => (
                          <div key={time} className="grid gap-1 border-b border-[#E6ECF5]" style={{ gridTemplateColumns: 'repeat(8, minmax(0, 1fr))' }}>
                            <div className="text-xs text-[#7A869A] py-3 text-center font-medium">{time}</div>
                            {weekDates.map(date => {
                              const events = getEventsAtTime(date, time);
                              const isTod = isSameDay(date, today);
                              return (
                                <div
                                  key={`${toDateStr(date)}-${time}`}
                                  className={`min-h-[64px] p-1 relative ${isTod ? "bg-blue-50/30" : ""}`}
                                >
                                  {events.map(ev => {
                                    const Icon = getEventIcon(ev.type);
                                    return (
                                      <motion.div
                                        key={ev.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="mb-1 p-1.5 rounded text-xs cursor-pointer hover:shadow-md transition-all"
                                        style={{ backgroundColor: `${ev.color}20`, borderLeft: `3px solid ${ev.color}` }}
                                        onClick={() => setSelectedEvent(ev)}
                                      >
                                        <div className="flex items-center gap-1">
                                          <Icon className="w-3 h-3 flex-shrink-0" style={{ color: ev.color }} />
                                          <span className="font-semibold truncate" style={{ color: ev.color }}>{ev.title}</span>
                                        </div>
                                        {ev.startTime && ev.endTime && (
                                          <div className="text-[10px] text-[#7A869A] mt-0.5">
                                            {ev.startTime}–{ev.endTime}
                                          </div>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── DAY VIEW ── */}
                {viewMode === "day" && (
                  <div>
                    {/* Day header */}
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#E6ECF5]">
                      <div>
                        <h3 className="font-bold text-[#1A1A1A]">
                          {focusDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                        </h3>
                        <p className="text-xs text-[#7A869A]">
                          {focusEvents.length} event{focusEvents.length !== 1 ? "s" : ""} scheduled
                          {isFocusToday && " · Today"}
                        </p>
                      </div>
                      {!isFocusToday && (
                        <Button size="sm" variant="outline" onClick={goToToday} className="text-xs border-[#E6ECF5]">
                          Go to Today
                        </Button>
                      )}
                    </div>

                    {focusEvents.length === 0 ? (
                      <div className="text-center py-16">
                        <CalendarIcon className="w-14 h-14 mx-auto mb-3 text-[#7A869A] opacity-30" />
                        <p className="text-[#7A869A] font-medium">No events on this day</p>
                        <p className="text-sm text-[#7A869A]/60 mt-1">
                          {activeFilter !== "all" ? `Try removing the "${TYPE_LABEL[activeFilter]}" filter` : "Enjoy your free time!"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-0 border-t border-[#E6ECF5]">
                        {timeSlots.map(time => {
                          const events = getEventsAtTime(focusDate, time);
                          return (
                            <div key={time} className="flex border-b border-[#E6ECF5] min-h-[80px]">
                              <div className="w-16 flex-shrink-0 py-3 px-2">
                                <span className="text-xs font-medium text-[#7A869A]">{time}</span>
                              </div>
                              <div className="flex-1 py-2 px-2 space-y-2">
                                {events.map(ev => {
                                  const Icon = getEventIcon(ev.type);
                                  return (
                                    <motion.div
                                      key={ev.id}
                                      initial={{ opacity: 0, x: -16 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="p-4 rounded-xl border-l-4 hover:shadow-lg transition-all cursor-pointer"
                                      style={{ backgroundColor: `${ev.color}10`, borderLeftColor: ev.color }}
                                      onClick={() => setSelectedEvent(ev)}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                        <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                                            <h4 className="font-bold text-[#1A1A1A] text-sm leading-tight">{ev.title}</h4>
                                            <Badge variant="outline" className={`${getEventBadgeColor(ev.type)} flex-shrink-0 text-xs`}>
                                              {ev.type}
                                            </Badge>
                                          </div>
                                          {ev.description && (
                                            <p className="text-xs text-[#7A869A] mb-2">{ev.description}</p>
                                          )}
                                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }} className="text-xs text-[#7A869A]">
                                            {ev.startTime && (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <Clock className="w-3 h-3" />
                                                <span>{ev.startTime}{ev.endTime && ` – ${ev.endTime}`}</span>
                                              </div>
                                            )}
                                            {ev.teacher && (
                                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <User className="w-3 h-3" />
                                                <span>{ev.teacher}</span>
                                              </div>
                                            )}
                                            {ev.location && (
                                              <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                <span>{ev.location}</span>
                                              </div>
                                            )}
                                          </div>
                                          <div className="flex gap-2 mt-2">
                                            {ev.priority === "high" && (
                                              <div className="flex items-center gap-1 text-xs text-red-600">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>High Priority</span>
                                              </div>
                                            )}
                                            {ev.completed && (
                                              <div className="flex items-center gap-1 text-xs text-green-600">
                                                <CheckCircle className="w-3 h-3" />
                                                <span>Completed</span>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Events without a specific time */}
                        {(() => {
                          const untimed = focusEvents.filter(e => !e.startTime);
                          if (!untimed.length) return null;
                          return (
                            <div className="pt-4">
                              <p className="text-xs font-semibold text-[#7A869A] mb-2 px-2">All Day / Deadlines</p>
                              <div className="space-y-2 px-2" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {untimed.map(ev => {
                                  const Icon = getEventIcon(ev.type);
                                  return (
                                    <motion.div
                                      key={ev.id}
                                      initial={{ opacity: 0, x: -16 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="p-4 rounded-xl border-l-4 cursor-pointer hover:shadow-md transition-all"
                                      style={{ backgroundColor: `${ev.color}10`, borderLeftColor: ev.color }}
                                      onClick={() => setSelectedEvent(ev)}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div className="p-2 rounded-lg" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                                          <Icon className="w-4 h-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                            <h4 className="font-bold text-[#1A1A1A] text-sm">{ev.title}</h4>
                                            <Badge variant="outline" className={`${getEventBadgeColor(ev.type)} text-xs`}>
                                              {ev.type}
                                            </Badge>
                                          </div>
                                          {ev.description && <p className="text-xs text-[#7A869A] mt-0.5">{ev.description}</p>}
                                          {ev.teacher && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="text-xs text-[#7A869A] mt-1">
                                              <User className="w-3 h-3" />
                                              <span>{ev.teacher}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </motion.div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Legend */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-[#1A1A1A] mb-3">Event Types</h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(TYPE_DOT_COLOR).map(([type, color]) => (
                    <button
                      key={type}
                      onClick={() => setActiveFilter(type as EventTypeFilter)}
                      className={`flex items-center gap-2 transition-opacity ${activeFilter !== "all" && activeFilter !== type ? "opacity-40" : ""}`}
                    >
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-[#7A869A] capitalize">{TYPE_LABEL[type]}</span>
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Selected / Today's Schedule */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-[#1A1A1A]">
                    {isFocusToday ? "Today's Schedule" : formatShortDate(focusDate)}
                  </h3>
                  <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                    {focusEvents.length} events
                  </Badge>
                </div>
                <div className="space-y-2">
                  {focusEvents.length === 0 ? (
                    <p className="text-sm text-[#7A869A] text-center py-4">No events</p>
                  ) : (
                    focusEvents.slice(0, 5).map(ev => {
                      const Icon = getEventIcon(ev.type);
                      return (
                        <motion.div
                          key={ev.id}
                          whileHover={{ x: 2 }}
                          className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#E6ECF5] cursor-pointer hover:shadow-sm transition-all"
                          onClick={() => setSelectedEvent(ev)}
                        >
                          <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1A1A1A] truncate">{ev.title}</p>
                            <p className="text-xs text-[#7A869A]">
                              {ev.startTime ? ev.startTime : ev.type}
                              {ev.priority === "high" && " · 🔴"}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  {focusEvents.length > 5 && (
                    <button
                      className="w-full text-xs text-[#1F6FEB] text-center py-2 hover:underline"
                      onClick={() => setViewMode("day")}
                    >
                      +{focusEvents.length - 5} more events
                    </button>
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Upcoming 7 Days */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card className="p-6">
                <h3 className="font-bold text-[#1A1A1A] mb-4">Upcoming (Next 7 Days)</h3>
                <div className="space-y-3">
                  {upcomingEvents.length === 0 ? (
                    <p className="text-sm text-[#7A869A] text-center py-4">No upcoming events</p>
                  ) : (
                    upcomingEvents.map((ev, idx) => {
                      const Icon = getEventIcon(ev.type);
                      const evDate = new Date(ev.date + "T00:00:00");
                      const daysUntil = Math.round((evDate.getTime() - today.getTime()) / 86400000);
                      return (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.15 + idx * 0.05 }}
                          className="p-3 bg-[#FAFBFF] rounded-xl border border-[#E6ECF5] hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                          onClick={() => setSelectedEvent(ev)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg flex-shrink-0" style={{ backgroundColor: `${ev.color}20`, color: ev.color }}>
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-sm font-medium text-[#1A1A1A] truncate">{ev.title}</p>
                                {ev.priority === "high" && (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                                )}
                              </div>
                              <p className="text-xs text-[#7A869A] mt-0.5">
                                {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `In ${daysUntil} days`}
                                {ev.startTime && ` · ${ev.startTime}`}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </Card>
            </motion.div>

            {/* Dynamic Week Stats */}
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-[#1A1A1A]">This Week</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Classes", value: weekStats.classes, color: "#3b82f6", max: 20 },
                    { label: "Homework", value: weekStats.assignments, color: "#a855f7", max: 15 },
                    { label: "Exams", value: weekStats.exams, color: "#ef4444", max: 5 },
                    { label: "Events", value: weekStats.events, color: "#8b5cf6", max: 5 },
                  ].map(({ label, value, color, max }) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#7A869A]">{label}</span>
                        <span className="font-bold text-[#1A1A1A]">{value}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                          transition={{ duration: 0.8, delay: 0.3 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Exam alerts */}
                {weekStats.exams > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700">
                      {weekStats.exams} exam{weekStats.exams > 1 ? "s" : ""} this week — make sure to review your notes!
                    </p>
                  </div>
                )}
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Event Detail Modal ── */}
      {selectedEvent && (
        <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      )}
    </div>
  );
}
