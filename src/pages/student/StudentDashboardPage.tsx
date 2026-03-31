import { useState, useEffect } from "react";
import {
  Calendar,
  Book,
  Calculator,
  Atom,
  BookOpen,
  Clock,
  ChevronRight,
  Target,
  Scroll,
  Leaf,
  CheckCircle2,
  Circle,
  Beaker,
  FileText,
  Video,
  BookMarked,
  PenTool,
} from "lucide-react";

import { motion } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Progress } from "@/components/student/ui/progress";
import { Badge } from "@/components/student/ui/badge";
import { Avatar, AvatarFallback } from "@/components/student/ui/avatar";
import {
  type HomeworkTopic,
} from "@/data/studentMockData";
import {
  StudentProfile,
  Quotes,
  TodaysClasses,
  PendingTasks,
  LearningGoals,
  DailyTasks,
  HomeworkService,
} from "@/services/student/studentDataService";
import { useNavigate } from "react-router";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeBanner } from "@/components/student/modules/WelcomeBanner";
import { NotificationCenter } from "@/components/student/NotificationCenter";
import { UserMenu } from "@/components/student/UserMenu";

const iconMap: Record<string, any> = {
  calculator: Calculator,
  atom: Atom,
  "book-open": BookOpen,
  scroll: Scroll,
  leaf: Leaf,
  book: Book,
  beaker: Beaker,
  clock: Clock,
  target: Target,
  "pen-tool": PenTool,
};

const taskTypeIcons: Record<string, any> = {
  homework: FileText,
  video: Video,
  assignment: PenTool,
  reading: BookMarked,
  essay: PenTool,
  study: BookMarked,
};

export function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [showDueToday, setShowDueToday] = useState(true);
  const [taskCompletionState, setTaskCompletionState] = useState<Record<number, boolean>>({});

  // ── Dynamic data from Firestore (async) ──
  const [studentInfo, setStudentInfo] = useState<any>({ name: "" });
  const [allPendingTasks, setAllPendingTasks] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [dailyTasksBySubject, setDailyTasksBySubject] = useState<any[]>([]);
  const [hwTopics, setHwTopics] = useState<any[]>([]);
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Don't fetch until auth is resolved — on refresh, auth.currentUser
    // is null until Firebase finishes initializing.
    if (authLoading || !user) return;

    (async () => {
      try {
        const [profile, tasks, classes, lg, daily, hw, q] = await Promise.allSettled([
          StudentProfile.get(),
          PendingTasks.getAll(),
          TodaysClasses.getAll(),
          LearningGoals.getAll(),
          DailyTasks.getAll(),
          HomeworkService.getAll(),
          Quotes.getRandom(),
        ]);
        if (profile.status === 'fulfilled') setStudentInfo(profile.value);
        if (tasks.status === 'fulfilled') setAllPendingTasks(tasks.value);
        if (classes.status === 'fulfilled') setAllClasses(classes.value);
        if (lg.status === 'fulfilled') setGoals(lg.value);
        if (daily.status === 'fulfilled') setDailyTasksBySubject(daily.value);
        if (hw.status === 'fulfilled') setHwTopics(hw.value);
        if (q.status === 'fulfilled') setQuote(q.value);
      } catch (err) {
        console.error('[StudentDashboard] Data fetch failed:', err);
      }
    })();
  }, [user, authLoading]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const greeting =
    new Date().getHours() < 12
      ? "Good morning"
      : new Date().getHours() < 18
        ? "Good afternoon"
        : "Good evening";

  const filteredTasks = showDueToday
    ? allPendingTasks.filter((task: any) => task.dueDate === "Today")
    : allPendingTasks;

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
        className="text-white p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative"
      >
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem] md:rounded-b-[3rem]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        </div>

        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="flex items-start justify-between mb-6 relative">
            {/* Left: greeting + date */}
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                {greeting}, {studentInfo.name.split(" ")[0]}! 👋
              </h1>
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{today}</span>
              </div>
            </div>

            {/* Right: notification bell + profile avatar */}
            <div className="flex items-center gap-2 -mt-1" style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.2))' }}>
              <div style={{
                '--usermenu-icon-color': '#fff',
              } as React.CSSProperties} className="usermenu-banner">
                <style>{`
                  .usermenu-banner button.usermenu-trigger { color: white !important; }
                  .usermenu-banner button.usermenu-trigger:hover { background: rgba(255,255,255,0.15) !important; }
                  .usermenu-banner button.usermenu-trigger svg { color: white !important; stroke: white !important; }
                  .usermenu-banner .usermenu-trigger span { pointer-events: none; }
                `}</style>
                <UserMenu />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20 shadow-lg max-w-2xl">
            <p className="text-sm md:text-base italic text-white/90 leading-relaxed font-medium">"{quote}"</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-3">
        <WelcomeBanner />

        {/* Classes and Homework row */}
        <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded-xl">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Today's Classes</h2>
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 font-medium">
                  {allClasses.length}
                </Badge>
              </div>

              <div className={`flex-1 ${(!allClasses || allClasses.length === 0) ? "flex items-center justify-center py-6" : ""}`}>
                {allClasses && allClasses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {allClasses.map((classItem: any, index: number) => {
                      const Icon = iconMap[classItem.icon];
                      return (
                        <motion.div
                          key={classItem.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 + index * 0.05 }}
                        >
                          <Card
                            className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white border-gray-100"
                            onClick={() => navigate(`/subject-detail/${classItem.id}`, { state: { classData: classItem } })}
                          >
                            <div className="flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className={`${classItem.color} p-2 rounded-lg shadow-sm`}>
                                  <Icon className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{classItem.time}</span>
                              </div>
                              <div>
                                <h3 className="font-bold text-gray-900 text-sm mb-1">{classItem.subject}</h3>
                                <p className="text-[10px] text-gray-500">👨‍🏫 {classItem.teacher}</p>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 py-10 px-8 max-w-sm w-full mx-auto">
                    <Calendar className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-center">No classes today.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-xl">
                    <BookOpen className="w-5 h-5 text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Homework</h2>
                </div>
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 px-3 py-1 font-medium">
                  {hwTopics.length}
                </Badge>
              </div>

              <div className={`flex-1 ${(!hwTopics || hwTopics.length === 0) ? "flex items-center justify-center py-6" : ""}`}>
                {hwTopics && hwTopics.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {hwTopics.map((hw: any, hwIndex: number) => {
                      const SubjectIcon = iconMap[hw.icon] || BookOpen;

                      return (
                        <motion.div
                          key={hw.subject + hwIndex}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 + hwIndex * 0.05 }}
                        >
                          <Card
                            className="p-4 hover:shadow-md transition-all cursor-pointer border-gray-100 bg-white"
                            onClick={() => navigate(`/homework/${hw.id}`)}
                          >
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`${hw.color} p-2 rounded-lg shadow-sm`}>
                                <SubjectIcon className="w-4 h-4 text-white" />
                              </div>
                              <h3 className="font-bold text-gray-900 text-xs truncate flex-1">{hw.subject}</h3>
                            </div>
                            <div className="p-2 bg-indigo-50/50 rounded-lg text-[10px] font-semibold text-indigo-700 mb-2 truncate">
                              {hw.topic || "Check tasks"}
                            </div>
                            {hw.teacher && (
                              <p className="text-[9px] text-gray-500 mb-2 truncate">👨‍🏫 {hw.teacher}</p>
                            )}
                            <div className="flex items-center justify-between text-[9px] text-gray-500 uppercase tracking-wider font-bold">
                              <span>Progress</span>
                              <span className="text-indigo-600">{hw.flashcardProgress || 0}%</span>
                            </div>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 py-10 px-8 max-w-sm w-full mx-auto">
                    <BookOpen className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm font-medium text-center">No homework assigned.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Pending Tasks */}
        {/* Pending Tasks + Learning Goals: side-by-side on md+ */}
        <div className="md:grid md:grid-cols-2 md:gap-3 space-y-3 md:space-y-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-50 rounded-xl">
                    <CheckCircle2 className="w-5 h-5 text-amber-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Pending Tasks</h2>
                </div>
                <div className="flex bg-gray-100 p-1 rounded-lg">
                  <button
                    onClick={() => setShowDueToday(true)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      showDueToday 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Due Today
                  </button>
                  <button
                    onClick={() => setShowDueToday(false)}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      !showDueToday 
                        ? "bg-white text-gray-900 shadow-sm" 
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>

              <div className="space-y-2 flex-1">
                {filteredTasks && filteredTasks.length > 0 ? (
                  filteredTasks.map((task, index) => {
                    const Icon = iconMap[task.icon];
                    return (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.05 }}
                      >
                        <Card className="p-4 hover:shadow-md transition-shadow border-gray-50 bg-white">
                          <div className="flex items-center gap-4">
                            <div className={`${task.color} p-2.5 rounded-xl shadow-sm`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900 text-sm mb-1">{task.title}</h3>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500 font-medium">
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  {task.estimatedTime}
                                </span>
                                <span className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                                  <Calendar className="w-3 h-3 text-blue-500" />
                                  {task.dueDate}
                                </span>
                                {task.priority === "high" && (
                                  <Badge className="bg-red-50 text-red-600 border-red-100 text-[10px] h-4 px-2">
                                    High Priority
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm" className="h-8 px-4 rounded-lg bg-blue-600 hover:bg-blue-700" onClick={() => navigate("/quiz")}>
                              Start
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 max-w-sm mx-auto w-full">
                    <CheckCircle2 className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No pending tasks.</p>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Learning Goals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Today's Goals</h2>
                </div>
              </div>

              <div className="space-y-3 flex-1 p-1">
                {goals && goals.length > 0 ? (
                  goals.map((goal: any, index: number) => {
                    const Icon = iconMap[goal.icon];
                    const progress = (goal.current / goal.target) * 100;
                    const isComplete = goal.current >= goal.target;

                    return (
                      <motion.div
                        key={goal.subject}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`${goal.color} p-2 rounded-lg shadow-sm`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="font-bold text-gray-900 text-sm">{goal.subject}</span>
                              <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                                {goal.current}/{goal.target}
                              </span>
                            </div>
                            <div className="relative">
                              <Progress value={progress} className="h-1.5 bg-gray-100" />
                              {isComplete && (
                                <div className="absolute -right-2 -top-2 bg-emerald-500 text-white rounded-full p-0.5 shadow-sm">
                                  <CheckCircle2 className="w-3 h-3" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 font-medium leading-relaxed pl-11">{goal.goal}</p>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100 max-w-sm mx-auto w-full">
                    <Target className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">No learning goals.</p>
                  </div>
                )}
              </div>
              
              {goals && goals.length > 0 && goals.every((g: any) => g.current >= g.target) && (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100/50 text-center"
                >
                  <p className="text-emerald-700 font-bold flex items-center justify-center gap-2">
                    <span className="text-xl">🎉</span> All goals completed! Amazing work!
                  </p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}