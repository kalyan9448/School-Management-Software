import { useState } from "react";
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
  studentData,
  motivationalQuotes,
  todaysClasses,
  pendingTasks,
  learningGoals,
  dailyTasksBySubject,
  homeworkTopics,
} from "@/data/studentMockData";
import { useNavigate } from "react-router";
import { WelcomeBanner } from "@/components/student/modules/WelcomeBanner";
import { NotificationCenter } from "@/components/student/NotificationCenter";

const iconMap: Record<string, any> = {
  calculator: Calculator,
  atom: Atom,
  "book-open": BookOpen,
  scroll: Scroll,
  leaf: Leaf,
  book: Book,
  beaker: Beaker,
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
  const [showDueToday, setShowDueToday] = useState(true);
  const [taskCompletionState, setTaskCompletionState] = useState<Record<number, boolean>>({});
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
  const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

  const filteredTasks = showDueToday
    ? pendingTasks.filter((task) => task.dueDate === "Today")
    : pendingTasks;

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
        className="text-white p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 tracking-tight">
                {greeting}, {studentData.name.split(" ")[0]}! 👋
              </h1>
              <div className="flex items-center gap-2 text-white/80">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">{today}</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/20 shadow-lg max-w-2xl">
            <p className="text-sm md:text-base italic text-white/90 leading-relaxed font-medium">"{quote}"</p>
          </div>
        </div>
      </motion.div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        <WelcomeBanner />

        {/* Today's Topics */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Today's Classes</h2>
            <Badge variant="secondary">{todaysClasses.length} classes</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {todaysClasses && todaysClasses.length > 0 ? (
              todaysClasses.map((classItem, index) => {
                const Icon = iconMap[classItem.icon];
                return (
                  <motion.div
                    key={classItem.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <Card
                      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/subject-detail/${classItem.id}`, { state: { classData: classItem } })}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`${classItem.color} p-3 rounded-xl`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-semibold text-gray-900">{classItem.subject}</h3>
                            <span className="text-sm text-gray-500">{classItem.time}</span>
                          </div>
                          <div className="flex flex-wrap gap-2 mb-2">
                            {classItem.topics && classItem.topics.length > 0 && classItem.topics.map((topic, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-sm text-gray-600">👨‍🏫 {classItem.teacher}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center text-gray-500">
                No classes scheduled for today.
              </div>
            )}
          </div>
        </motion.div>

        {/* Daily Tasks by Subject */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-bold text-gray-900">Homework - Topics of the Day</h2>
            <Badge variant="secondary">
              {homeworkTopics.length} subjects
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dailyTasksBySubject && dailyTasksBySubject.length > 0 ? (
              dailyTasksBySubject.map((subjectData, subjectIndex) => {
                const SubjectIcon = iconMap[subjectData.icon];
                const homeworkTopic = homeworkTopics.find(ht => ht.subject === subjectData.subject);

                return (
                  <motion.div
                    key={subjectData.subject}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.15 + subjectIndex * 0.05 }}
                  >
                    <Card
                      className="p-5 hover:shadow-md transition-all cursor-pointer border-[#E6ECF5]"
                      onClick={() => {
                        if (homeworkTopic) {
                          navigate(`/homework/${homeworkTopic.id}`);
                        }
                      }}
                    >
                      {/* Subject Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`${subjectData.color} p-3 rounded-xl`}>
                          <SubjectIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{subjectData.subject}</h3>
                          <p className="text-sm text-gray-600">👨‍🏫 {subjectData.teacher}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      {/* Topic of the Day */}
                      <div className="mb-3 p-3 bg-[#FAFBFF] rounded-lg border border-[#E6ECF5]">
                        <p className="text-xs text-[#7A869A] mb-1 font-medium">📚 Topic of the Day</p>
                        <p className="text-sm text-[#1A1A1A] font-medium">
                          {homeworkTopic?.topic || "AI Homework Available"}
                        </p>
                      </div>

                      {/* Status Badge */}
                      {homeworkTopic && (
                        <div className="flex items-center gap-2 mb-3">
                          {(() => {
                            const status = homeworkTopic.status;
                            const statusConfig = {
                              pending: { label: "Pending", color: "bg-gray-100 text-gray-700 border-gray-200", icon: Circle },
                              "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700 border-blue-200", icon: Clock },
                              completed: { label: "Completed", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle2 },
                            };
                            const statusInfo = statusConfig[status];
                            const StatusIcon = statusInfo.icon;

                            return (
                              <Badge
                                variant="outline"
                                className={`text-xs font-medium border ${statusInfo.color}`}
                              >
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </Badge>
                            );
                          })()}
                        </div>
                      )}

                      {/* Progress Indicators */}
                      {homeworkTopic && (
                        <div className="space-y-2">
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#7A869A]">
                                Flashcards {homeworkTopic.flashcardsCompleted && "✓"}
                              </span>
                              <span className="text-[#1A1A1A] font-medium">
                                {homeworkTopic.flashcardProgress}%
                              </span>
                            </div>
                            <Progress
                              value={homeworkTopic.flashcardProgress}
                              className="h-1.5 bg-gray-100"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between text-xs mb-1">
                              <span className="text-[#7A869A]">
                                Questions {homeworkTopic.questionsCompleted && "✓"}
                              </span>
                              <span className="text-[#1A1A1A] font-medium">
                                {homeworkTopic.questionsAttempted}/{homeworkTopic.totalQuestions}
                              </span>
                            </div>
                            <Progress
                              value={homeworkTopic.questionsProgress}
                              className="h-1.5 bg-gray-100"
                            />
                          </div>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center text-gray-500">
                No daily tasks available.
              </div>
            )}
          </div>
        </motion.div>

        {/* Pending Tasks */}
        {/* Pending Tasks + Learning Goals: side-by-side on lg */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-6 space-y-6 lg:space-y-0">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Pending Tasks</h2>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={showDueToday ? "default" : "outline"}
                  onClick={() => setShowDueToday(true)}
                >
                  Due Today
                </Button>
                <Button
                  size="sm"
                  variant={!showDueToday ? "default" : "outline"}
                  onClick={() => setShowDueToday(false)}
                >
                  All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredTasks && filteredTasks.length > 0 ? (
                filteredTasks.map((task, index) => {
                  const Icon = iconMap[task.icon];
                  const TaskTypeIcon = taskTypeIcons[task.type];
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                    >
                      <Card className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className={`${task.color} p-3 rounded-xl`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 mb-1">{task.title}</h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {task.estimatedTime}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {task.dueDate}
                              </span>
                              {task.priority === "high" && (
                                <Badge variant="destructive" className="text-xs">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Button size="sm" onClick={() => navigate("/quiz")}>
                            Start
                          </Button>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center text-gray-500">
                  No pending tasks.
                </div>
              )}
            </div>
          </motion.div>

          {/* Learning Goals */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold text-gray-900">Today's Goals</h2>
              <Target className="w-5 h-5 text-blue-600" />
            </div>

            <Card className="p-5">
              <div className="space-y-4">
                {learningGoals && learningGoals.length > 0 ? (
                  learningGoals.map((goal, index) => {
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
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`${goal.color} p-2 rounded-lg`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-900">{goal.subject}</span>
                              <span className="text-sm text-gray-600">
                                {goal.current}/{goal.target}
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                          {isComplete && <span className="text-green-500">✓</span>}
                        </div>
                        <p className="text-sm text-gray-600 ml-11">{goal.goal}</p>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="text-center text-gray-500">
                    No learning goals set for today.
                  </div>
                )}
              </div>
              {learningGoals && learningGoals.every((g) => g.current >= g.target) && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-4 p-3 bg-green-50 rounded-lg text-center"
                >
                  <p className="text-green-700 font-medium">🎉 All goals completed! Amazing work!</p>
                </motion.div>
              )}
            </Card>
          </motion.div>
        </div>

      </div>
    </div>
  );
}