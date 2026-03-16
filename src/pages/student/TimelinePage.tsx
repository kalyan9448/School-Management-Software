import { useState } from "react";
import {
  Calendar,
  BookOpen,
  MessageSquare,
  CheckCircle,
  Filter,
  Search,
  Download,
  Calculator,
  Atom,
  Scroll,
  Clock,
  Award,
  User,
} from "lucide-react";

import { motion } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Input } from "@/components/student/ui/input";
import { Avatar, AvatarFallback } from "@/components/student/ui/avatar";
import { timelineEvents } from "@/data/studentMockData";


const iconMap: Record<string, any> = {
  calculator: Calculator,
  atom: Atom,
  "book-open": BookOpen,
  scroll: Scroll,
};

const eventTypeColors: Record<string, string> = {
  class: "bg-blue-500",
  quiz: "bg-purple-500",
  note: "bg-green-500",
  attendance: "bg-gray-500",
  fee: "bg-orange-500",
};

const eventTypeIcons: Record<string, any> = {
  class: BookOpen,
  quiz: CheckCircle,
  attendance: Calendar,
  fee: Calendar,
};

export function TimelinePage() {
  const [filterType, setFilterType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredEvents = timelineEvents.filter((event) => {
    const matchesType = filterType === "all" || event.type === filterType;
    const matchesSearch =
      searchQuery === "" ||
      event.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const groupedEvents = filteredEvents.reduce((acc, event) => {
    const date = event.date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {} as Record<string, typeof timelineEvents>);

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAFBFF' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} className="text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-screen-xl mx-auto">
          <h1 className="text-2xl font-bold mb-4">Learning Timeline</h1>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <Input
              placeholder="Search timeline..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={filterType === "all" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType("all")}
              className="whitespace-nowrap"
            >
              All Events
            </Button>
            <Button
              variant={filterType === "class" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType("class")}
              className="whitespace-nowrap"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Classes
            </Button>
            <Button
              variant={filterType === "quiz" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType("quiz")}
              className="whitespace-nowrap"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Quizzes
            </Button>
            <Button
              variant={filterType === "note" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setFilterType("note")}
              className="whitespace-nowrap"
            >
              <MessageSquare className="w-4 h-4 mr-1" />
              Notes
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">{filteredEvents.length} events</p>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-200 to-blue-200" />

          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([date, events], dateIndex) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-white rounded-full p-3 shadow-sm z-10 border-2 border-purple-200">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">
                      {new Date(date).toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                    </h2>
                    <p className="text-sm text-gray-600">{events.length} events</p>
                  </div>
                </div>

                {/* Events */}
                <div className="space-y-4 ml-16">
                  {events.map((event, eventIndex) => {
                    const EventIcon = eventTypeIcons[event.type];
                    const SubjectIcon = event.icon ? iconMap[event.icon] : null;

                    return (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: eventIndex * 0.05 }}
                      >
                        {/* Class Event */}
                        {event.type === "class" && (
                          <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className={`${event.color} p-3 rounded-xl`}>
                                {SubjectIcon && <SubjectIcon className="w-5 h-5 text-white" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Class
                                  </Badge>
                                  <span className="text-sm text-gray-500">{event.time}</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                                <div className="flex flex-wrap gap-2 mb-2">
                                  {event.topics?.map((topic, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {topic}
                                    </Badge>
                                  ))}
                                </div>
                                <p className="text-sm text-gray-600">👨‍🏫 {event.teacher}</p>
                                {event.objectives && (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {event.objectives.map((obj, i) => (
                                      <span key={i} className="text-xs text-gray-500">
                                        • {obj}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Quiz Event */}
                        {event.type === "quiz" && (
                          <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <div className={`${event.color} p-3 rounded-xl`}>
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Quiz
                                  </Badge>
                                  <span className="text-sm text-gray-500">{event.time}</span>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`text-2xl font-bold ${
                                      event.score! >= 90
                                        ? "text-green-600"
                                        : event.score! >= 70
                                        ? "text-blue-600"
                                        : "text-orange-600"
                                    }`}
                                  >
                                    {event.score}%
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    <p>
                                      {event.correctAnswers}/{event.totalQuestions} correct
                                    </p>
                                    <p className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {event.timeSpent}
                                    </p>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="mt-3">
                                  View Details
                                </Button>
                              </div>
                            </div>
                          </Card>
                        )}


                        {/* Note Event */}
                        {event.type === "note" && (
                          <Card
                            className={`p-4 hover:shadow-md transition-shadow ${
                              event.category === "positive"
                                ? "bg-green-50 border-green-200"
                                : event.category === "needs-attention"
                                ? "bg-orange-50 border-orange-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-blue-100 text-blue-700">
                                  {event.teacherAvatar}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Teacher Note
                                  </Badge>
                                  <span className="text-sm text-gray-500">{event.time}</span>
                                </div>
                                <p className="font-medium text-gray-900 mb-1">{event.teacher}</p>
                                <p className="text-sm text-gray-700">{event.note}</p>
                              </div>
                            </div>
                          </Card>
                        )}

                        {/* Attendance Event */}
                        {event.type === "attendance" && (
                          <Card className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-4">
                              <div
                                className={`${
                                  event.status === "present" ? "bg-green-500" : "bg-red-500"
                                } p-3 rounded-xl`}
                              >
                                <CheckCircle className="w-5 h-5 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="outline" className="text-xs">
                                    Attendance
                                  </Badge>
                                  <Badge
                                    variant={event.status === "present" ? "default" : "destructive"}
                                    className="text-xs"
                                  >
                                    {event.status}
                                  </Badge>
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p>Check-in: {event.checkIn}</p>
                                  <p>Check-out: {event.checkOut}</p>
                                </div>
                              </div>
                            </div>
                          </Card>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or search query</p>
          </div>
        )}
      </div>
    </div>
  );
}