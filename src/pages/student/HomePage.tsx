import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useNavigate } from "react-router";
import {
  Calculator,
  Atom,
  BookOpen,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Target,
  Beaker,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { type HomeworkTopic } from "@/data/studentMockData";
import { HomeworkService } from "@/services/student/studentDataService";

const iconMap: Record<string, any> = {
  calculator: Calculator,
  atom: Atom,
  book: BookOpen,
  "book-open": BookOpen,
  beaker: Beaker,
};

const statusConfig = {
  pending: {
    label: "Pending",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Circle,
  },
  "in-progress": {
    label: "In Progress",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Clock,
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
};

export function HomePage() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<HomeworkTopic[]>([]);

  useEffect(() => {
    HomeworkService.getAll().then(setTopics);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAFBFF] pb-24">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-8 shadow-lg"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">AI Homework</h1>
              <p className="text-white/80 text-sm">
                Complete flashcards to unlock objective questions
              </p>
            </div>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-3 mt-6">
            <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex flex-col items-center">
                <CheckCircle2 className="w-6 h-6 text-yellow-300 mb-1" />
                <p className="text-2xl font-bold">{topics.filter(t => t.status === "completed").length}</p>
                <p className="text-xs text-white/80">Completed</p>
              </div>
            </Card>
            <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex flex-col items-center">
                <Clock className="w-6 h-6 text-blue-300 mb-1" />
                <p className="text-2xl font-bold">{topics.filter(t => t.status === "in-progress").length}</p>
                <p className="text-xs text-white/80">In Progress</p>
              </div>
            </Card>
            <Card className="p-4 bg-white/10 backdrop-blur-sm border-white/20">
              <div className="flex flex-col items-center">
                <Target className="w-6 h-6 text-green-300 mb-1" />
                <p className="text-2xl font-bold">{topics.filter(t => t.status === "pending").length}</p>
                <p className="text-xs text-white/80">Pending</p>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>

      {/* Topic Cards */}
      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6">
        {topics.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="bg-[#EEF4FF] p-6 rounded-full mb-5">
              <BookOpen className="w-12 h-12 text-[#1F6FEB]" />
            </div>
            <h2 className="text-xl font-bold text-[#1A1A1A] mb-2">No homeworks today</h2>
            <p className="text-[#7A869A] text-sm max-w-xs">
              You're all caught up! Check back later for new assignments from your teachers.
            </p>
          </motion.div>
        ) : (
        <div className="space-y-4 md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-4 md:space-y-0">
          {topics.map((topic, index) => {
            const Icon = iconMap[topic.icon];
            const statusInfo = statusConfig[topic.status];
            const StatusIcon = statusInfo.icon;
            const overallProgress = (topic.flashcardProgress + topic.questionsProgress) / 2;

            return (
              <motion.div
                key={topic.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className="p-5 hover:shadow-lg transition-all cursor-pointer border-[#E6ECF5] bg-white"
                  onClick={() => navigate(`/homework/${topic.id}`)}
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`${topic.color} p-3 rounded-2xl flex-shrink-0 shadow-sm border border-white/20`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-[#1A1A1A] text-base lg:text-lg mb-0.5 truncate">
                            {topic.subject}
                          </h3>
                          <p className="text-xs lg:text-sm text-[#7A869A] line-clamp-1">
                            {topic.topic}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#7A869A]/40 flex-shrink-0 mt-1" />
                      </div>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[10px] lg:text-xs text-[#7A869A] font-medium px-2 py-0.5 bg-gray-50 rounded-md border border-gray-100">
                          👨‍🏫 {topic.teacher}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2 mb-3">
                    <Badge
                      variant="outline"
                      className={`text-xs font-medium border ${statusInfo.color}`}
                    >
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {statusInfo.label}
                    </Badge>
                    {topic.accuracy !== null && (
                      <Badge
                        variant="outline"
                        className="text-xs font-medium border bg-purple-50 text-purple-700 border-purple-200"
                      >
                        {topic.accuracy}% Accuracy
                      </Badge>
                    )}
                  </div>

                  {/* Progress Indicators */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#7A869A]">
                          Flashcards {topic.flashcardsCompleted && "✓"}
                        </span>
                        <span className="text-[#1A1A1A] font-medium">
                          {topic.flashcardProgress}%
                        </span>
                      </div>
                      <Progress
                        value={topic.flashcardProgress}
                        className="h-2 bg-gray-100"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#7A869A]">
                          Questions {topic.questionsCompleted && "✓"}
                          {!topic.flashcardsCompleted && " (Locked 🔒)"}
                        </span>
                        <span className="text-[#1A1A1A] font-medium">
                          {topic.questionsAttempted}/{topic.totalQuestions}
                        </span>
                      </div>
                      <Progress
                        value={topic.questionsProgress}
                        className="h-2 bg-gray-100"
                      />
                    </div>

                    {overallProgress > 0 && (
                      <div className="pt-2 border-t border-[#E6ECF5]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[#7A869A] font-medium">
                            Overall Progress
                          </span>
                          <span className="text-[#1F6FEB] font-bold">
                            {Math.round(overallProgress)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Last Attempt */}
                  {topic.lastAttemptDate && (
                    <div className="mt-3 pt-3 border-t border-[#E6ECF5]">
                      <p className="text-xs text-[#7A869A]">
                        Last attempt: {new Date(topic.lastAttemptDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
        )}
      </div>
    </div>
  );
}