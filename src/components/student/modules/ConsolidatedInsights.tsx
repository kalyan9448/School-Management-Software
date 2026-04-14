import { useState, useEffect } from "react";
import { 
  Trophy, 
  Brain, 
  CheckCircle, 
  Calendar, 
  TrendingUp, 
  BookOpen, 
  Target, 
  Activity 
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Progress } from "@/components/student/ui/progress";
import { Badge } from "@/components/student/ui/badge";
import { DashboardService } from "@/services/student/studentDataService";

export function ConsolidatedInsights() {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchInsights() {
      try {
        const data = await DashboardService.getInsights();
        setInsights(data);
      } catch (err) {
        console.error("Failed to load insights:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6 bg-white/50 backdrop-blur-sm border-none h-[120px] animate-pulse" />
        ))}
      </div>
    );
  }

  if (!insights) return null;

  const cards = [
    {
      label: "Academic Rating",
      value: `${insights.academicRating}%`,
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-50",
      trend: "Overall Performance",
      progress: insights.academicRating
    },
    {
      label: "Quiz Mastery",
      value: `${insights.quizMastery}%`,
      icon: Brain,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      trend: "Quiz Accuracy",
      progress: insights.quizMastery
    },
    {
      label: "Attendance",
      value: `${insights.attendance}%`,
      icon: Calendar,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      trend: "Class Presence",
      progress: insights.attendance
    },
    {
      label: "HW Completion",
      value: `${insights.homeworkCompletion}%`,
      icon: BookOpen,
      color: "text-blue-500",
      bg: "bg-blue-50",
      trend: "Task Progress",
      progress: insights.homeworkCompletion
    }
  ];

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center gap-2 px-1">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900">Academic Insights</h2>
        <Badge variant="outline" className="ml-2 bg-indigo-50 border-indigo-100 text-indigo-600 font-bold">Live Stats</Badge>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="p-5 border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden relative">
                {/* Background glow */}
                <div className={`absolute -right-4 -top-4 w-16 h-16 ${card.bg} rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 ${card.bg} rounded-xl group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-gray-400 font-bold border-none">
                        {card.trend}
                    </Badge>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{card.label}</h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-black text-gray-900 leading-none">{card.value}</span>
                      {card.progress >= 80 && (
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Progress value={card.progress} className={`h-1.5 ${card.bg}`} />
                    <div className="flex justify-between text-[10px] font-bold text-gray-400">
                      <span>0%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
