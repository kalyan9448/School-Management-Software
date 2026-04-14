import { useState, useEffect } from "react";
import { Sparkles, Brain, ArrowRight, Clock, Target, ChevronRight, Lightbulb, Zap } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { AIRecommendationService } from "@/services/student/studentDataService";
import { useNavigate } from "react-router";

export function AILearningRecommendations() {
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const data = await AIRecommendationService.getRecommendation();
        setRecommendation(data);
      } catch (err) {
        console.error("Failed to load AI recommendations:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRecommendation();
  }, []);

  if (loading) {
    return (
      <Card className="p-6 border-none shadow-sm bg-white/80 backdrop-blur-sm h-[200px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-8 h-8 text-indigo-400 opacity-50" />
          </motion.div>
          <p className="text-sm font-medium text-gray-400 animate-pulse">Analyzing your learning patterns...</p>
        </div>
      </Card>
    );
  }

  if (!recommendation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-none shadow-xl bg-white relative">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full translate-x-32 -translate-y-32 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full -translate-x-24 translate-y-24 blur-3xl opacity-50" />

        <div className="relative p-6">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-lg ring-4 ring-indigo-50">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 tracking-tight">AI Study Guide</h2>
                <p className="text-xs text-indigo-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Zap className="w-3 h-3" /> Personalized for you
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-white border-indigo-100 text-indigo-600 px-3 py-1 font-bold shadow-sm">
                    {recommendation.subject}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-full">
                    <Clock className="w-3 h-3" />
                    {recommendation.estimatedTime}
                </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid md:grid-cols-2 gap-8 items-start">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold text-gray-500 mb-2 flex items-center gap-2">
                   <Target className="w-4 h-4 text-rose-500" /> RECOMMENDED NEXT TOPIC
                </p>
                <h3 className="text-3xl font-black text-gray-900 leading-tight mb-2">
                  {recommendation.recommendedTopic}
                </h3>
                <p className="text-indigo-600 font-semibold text-sm bg-indigo-50 inline-block px-3 py-1 rounded-lg border border-indigo-100">
                  {recommendation.whyLabel}
                </p>
              </div>

              <div className="p-5 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl border border-indigo-100/50">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <Brain className="w-4 h-4 text-indigo-600" />
                    </div>
                    <h4 className="font-bold text-indigo-900 text-sm">Motivation Kickstart</h4>
                </div>
                <p className="text-indigo-800/80 text-sm italic font-medium leading-relaxed">
                  "{recommendation.encouragement}"
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-amber-500" /> 
                  Approach: <span className="text-indigo-600">{recommendation.approachTitle}</span>
                </h4>
                <Badge className={`${
                    recommendation.difficulty === 'High' ? 'bg-rose-100 text-rose-600' :
                    recommendation.difficulty === 'Medium' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                } border-none font-bold`}>
                    {recommendation.difficulty} Intensity
                </Badge>
              </div>

              <div className="space-y-2.5">
                {(recommendation.approach || []).map((step: string, idx: number) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="flex gap-3 items-start p-3 bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 hover:shadow-sm transition-all group"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xs shrink-0 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      {idx + 1}
                    </div>
                    <p className="text-sm text-gray-600 font-medium leading-relaxed group-hover:text-gray-900">
                      {step}
                    </p>
                  </motion.div>
                ))}
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  className="flex-1 h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 font-bold gap-2 text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
                  onClick={() => navigate('/homework')}
                >
                  Start Studying <ChevronRight className="w-5 h-5" />
                </Button>
                <Button 
                    variant="ghost" 
                    className="h-12 w-12 rounded-2xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 bg-white"
                >
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
