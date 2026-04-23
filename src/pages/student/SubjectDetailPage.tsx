import { motion } from "motion/react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Target,
  Lightbulb,
  Sparkles,
  Loader2,
  Brain,
  Zap,
  MapPin,
  AlertTriangle,
  Globe,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { TodaysClasses, StudentLearningContextService } from "@/services/student/studentDataService";
import { aiService } from "@/services/aiService";
import { lessonService } from "@/utils/firestoreService";
import { useAIFeatureEnabled } from "@/hooks/useAIFeatureEnabled";

export function SubjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isEnabled: isAIEnabled } = useAIFeatureEnabled();

  const [classItem, setClassItem] = useState<any>(undefined);
  const [loading, setLoading] = useState(true);
  const [aiTopicDetails, setAiTopicDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const classes = await TodaysClasses.getAll();
        const found = classes.find((c: any) => String(c.id) === String(id));
        if (found) {
          const todayStr = new Date().toISOString().split("T")[0];
          try {
            const ctx = await StudentLearningContextService.get(found.subject);
            const grade = ctx.grade;
            const section = ctx.section;
            const lessons = await lessonService.getByClass(grade, section);
            const todayLesson = lessons.find(
              (l: any) =>
                l.date === todayStr &&
                l.subject?.toLowerCase() === found.subject?.toLowerCase()
            );
            if (todayLesson) {
              (found as any).recentTopic = todayLesson.topic;
              (found as any).recentObjectives = todayLesson.objectives;
            }
          } catch (e) {
            console.warn("Could not fetch lesson logs:", e);
          }
        }
        setClassItem(found);
      } catch (e) {
        console.error("Failed to load class data:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!classItem) return;
    const topic = classItem.recentTopic || classItem.topics?.[0] || classItem.subject;

    (async () => {
      setIsGenerating(true);
      try {
        if (isAIEnabled) {
          // Build full student context for deep pedagogy generation
          const ctx = await StudentLearningContextService.get(classItem.subject, topic);
          const overview = await aiService.generateStudentConceptOverview(
            classItem.subject,
            topic,
            ctx
          );
          if (overview) setAiTopicDetails(overview);
        } else {
          // Fallback without AI
          setAiTopicDetails({
            mainTopic: topic,
            description: `Explore ${topic} in ${classItem.subject}.`,
            overview: `This is today's topic: ${topic}.`,
            deepExplanation: "",
            learningObjectives: classItem.recentObjectives || [],
            keyPoints: [],
            ageAppropriateAnalogy: null,
            stepByStepBreakdown: [],
            commonMisconceptions: [],
            curriculumFocus: "",
            realWorldConnections: [],
            encouragement: "Keep learning!",
            difficultyLevel: "standard",
          });
        }
      } catch (error) {
        console.error("AI Overview generation failed:", error);
      } finally {
        setIsGenerating(false);
      }
    })();
  }, [classItem?.id, isAIEnabled]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-[#7A869A] text-sm">Loading class details...</p>
        </div>
      </div>
    );
  }

  if (!classItem) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-[#7A869A] mb-6">
            Class not found. Please select a subject from the dashboard.
          </p>
          <Button onClick={() => navigate("/")} className="bg-blue-600 hover:bg-blue-700 text-white">
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const difficultyColor =
    aiTopicDetails?.difficultyLevel === "simplified"
      ? "bg-green-100 text-green-700 border-green-200"
      : aiTopicDetails?.difficultyLevel === "advanced"
      ? "bg-rose-100 text-rose-700 border-rose-200"
      : "bg-blue-100 text-blue-700 border-blue-200";

  const difficultyLabel =
    aiTopicDetails?.difficultyLevel === "simplified"
      ? "Simplified for you"
      : aiTopicDetails?.difficultyLevel === "advanced"
      ? "Advanced level"
      : "Standard level";

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div
        className="text-white p-6 md:p-10 lg:p-12 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative overflow-hidden"
        style={{ background: "linear-gradient(to right, #0A2540, #1F6FEB)" }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="max-w-screen-xl mx-auto relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="text-white hover:bg-white/10 mb-4 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-widest text-[10px] mb-2">
                <Brain className="w-4 h-4" />
                AI-Personalized Learning
              </div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">
                {classItem.subject}
              </h1>
              {aiTopicDetails?.mainTopic && (
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <p className="text-sm md:text-base font-medium">{aiTopicDetails.mainTopic}</p>
                </div>
              )}
              <div className="flex items-center gap-4 mt-2 text-white/70 text-sm flex-wrap">
                {classItem.teacher && <span>👨‍🏫 {classItem.teacher}</span>}
                {classItem.time && <span>🕐 {classItem.time}</span>}
                {aiTopicDetails && !isGenerating && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${difficultyColor}`}>
                    {difficultyLabel}
                  </span>
                )}
              </div>
            </div>

            {aiTopicDetails?.encouragement && !isGenerating && (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20 max-w-xs">
                <p className="text-xs text-white/90 italic leading-relaxed">
                  ✨ {aiTopicDetails.encouragement}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6 pb-24">

        {/* Generating skeleton */}
        {isGenerating && (
          <div className="space-y-4">
            <Card className="p-8 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <Brain className="w-10 h-10 text-purple-300 animate-pulse" />
                <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <p className="text-gray-700 font-semibold">Generating your personalized learning guide...</p>
              <p className="text-gray-400 text-sm">Analyzing your performance & curriculum</p>
              <div className="w-full max-w-sm space-y-2 mt-2">
                <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-4/5 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-3/5 animate-pulse" />
              </div>
            </Card>
          </div>
        )}

        {/* No topic state */}
        {!isGenerating && !aiTopicDetails && (
          <Card className="p-10 flex flex-col items-center justify-center gap-3 text-center">
            <BookOpen className="w-12 h-12 text-gray-200" />
            <p className="text-lg font-semibold text-gray-500">No topic for today</p>
            <p className="text-sm text-gray-400">
              Your teacher hasn't logged a lesson for{" "}
              <span className="font-medium">{classItem.subject}</span> today yet.
              <br />
              Check back after class.
            </p>
          </Card>
        )}

        {/* Main content */}
        {!isGenerating && aiTopicDetails && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              {/* Left: Main overview (2/3) */}
              <div className="lg:col-span-2 space-y-5">

                {/* Description hook */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                  <Card className="p-6 md:p-8 border-none bg-gradient-to-br from-white to-purple-50/30 shadow-lg rounded-3xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 opacity-30 rounded-l-3xl" />
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-purple-50 rounded-2xl flex-shrink-0">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-black text-gray-900 tracking-tight">AI-Enhanced Learning Guide</h2>
                          <Badge className="bg-purple-100 text-purple-700 border-none text-[10px] px-2 py-0.5">
                            Powered by AI
                          </Badge>
                        </div>
                        <p className="text-gray-600 leading-relaxed font-medium">{aiTopicDetails.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Deep Explanation */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card className="p-6 md:p-8 border-none bg-white shadow-lg rounded-3xl">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2.5 bg-blue-50 rounded-xl">
                        <BookOpen className="w-5 h-5 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-black text-gray-900">Deep Concept Explanation</h3>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{aiTopicDetails.overview}</p>
                    {aiTopicDetails.deepExplanation && (
                      <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                        <p className="text-gray-700 leading-relaxed text-sm">{aiTopicDetails.deepExplanation}</p>
                      </div>
                    )}
                  </Card>
                </motion.div>

                {/* Age-Appropriate Analogy */}
                {aiTopicDetails.ageAppropriateAnalogy && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="p-6 border-none bg-gradient-to-br from-amber-50 to-orange-50 shadow-md rounded-3xl border border-amber-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2 bg-amber-100 rounded-xl">
                          <Lightbulb className="w-5 h-5 text-amber-600" />
                        </div>
                        <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider">Think of It This Way</h4>
                      </div>
                      <p className="text-amber-800 font-medium leading-relaxed italic">
                        "{aiTopicDetails.ageAppropriateAnalogy}"
                      </p>
                    </Card>
                  </motion.div>
                )}

                {/* Step-by-Step Breakdown */}
                {aiTopicDetails.stepByStepBreakdown?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-6 md:p-8 border-none bg-white shadow-lg rounded-3xl">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-emerald-50 rounded-xl">
                          <Zap className="w-5 h-5 text-emerald-600" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900">Step-by-Step Breakdown</h3>
                      </div>
                      <div className="space-y-3">
                        {aiTopicDetails.stepByStepBreakdown.map((item: any, i: number) => (
                          <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-emerald-200 transition-colors">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm font-black flex-shrink-0">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">{item.step}</p>
                              <p className="text-gray-500 text-sm mt-0.5 leading-relaxed">{item.explanation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Common Misconceptions */}
                {aiTopicDetails.commonMisconceptions?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card className="p-6 md:p-8 border-none bg-rose-50/60 shadow-md rounded-3xl border border-rose-100">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-rose-100 rounded-xl">
                          <AlertTriangle className="w-5 h-5 text-rose-600" />
                        </div>
                        <h3 className="text-lg font-black text-rose-900">Watch Out For These Mistakes</h3>
                      </div>
                      <div className="space-y-3">
                        {aiTopicDetails.commonMisconceptions.map((item: any, i: number) => (
                          <div key={i} className="p-4 bg-white rounded-2xl border border-rose-100">
                            <p className="text-rose-700 text-sm font-semibold mb-1">
                              ❌ {item.misconception}
                            </p>
                            <p className="text-emerald-700 text-sm font-medium">
                              ✅ {item.correction}
                            </p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}
              </div>

              {/* Right: Objectives, Key Points, Curriculum, Real World */}
              <div className="space-y-5 mt-6 lg:mt-0">
                {/* Learning Objectives */}
                {aiTopicDetails.learningObjectives?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <Card className="p-6 border-none bg-white shadow-lg rounded-3xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-green-50 rounded-xl">
                          <Target className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="font-black text-gray-900 text-base">Objectives</h3>
                      </div>
                      <ul className="space-y-2.5">
                        {aiTopicDetails.learningObjectives.map((obj: string, i: number) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <div className="mt-0.5 bg-green-100 rounded-full p-0.5 flex-shrink-0">
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            </div>
                            <span className="text-gray-600 text-sm font-medium leading-relaxed">{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}

                {/* Key Points */}
                {aiTopicDetails.keyPoints?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <Card className="p-6 border-none bg-white shadow-lg rounded-3xl">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-amber-50 rounded-xl">
                          <Lightbulb className="w-5 h-5 text-amber-600" />
                        </div>
                        <h3 className="font-black text-gray-900 text-base">Key Points</h3>
                      </div>
                      <div className="space-y-2">
                        {aiTopicDetails.keyPoints.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-black flex-shrink-0">
                              {i + 1}
                            </div>
                            <p className="text-gray-600 text-sm font-medium leading-relaxed">{point}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Curriculum Focus */}
                {aiTopicDetails.curriculumFocus && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                    <Card className="p-5 border-none bg-indigo-50 shadow-md rounded-2xl border border-indigo-100">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-indigo-600" />
                        <h4 className="font-black text-indigo-900 text-sm">Curriculum Focus</h4>
                      </div>
                      <p className="text-indigo-700 text-sm leading-relaxed">{aiTopicDetails.curriculumFocus}</p>
                    </Card>
                  </motion.div>
                )}

                {/* Real World Connections */}
                {aiTopicDetails.realWorldConnections?.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <Card className="p-5 border-none bg-white shadow-md rounded-2xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="p-1.5 bg-teal-50 rounded-lg">
                          <Globe className="w-4 h-4 text-teal-600" />
                        </div>
                        <h4 className="font-black text-gray-900 text-sm">Real-World Connections</h4>
                      </div>
                      <ul className="space-y-2">
                        {aiTopicDetails.realWorldConnections.map((conn: string, i: number) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                            <ChevronRight className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
                            <span className="font-medium">{conn}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </motion.div>
                )}
              </div>
            </div>

            {/* Start Learning CTA */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }} className="lg:max-w-2xl lg:mx-auto">
              <Card className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 border-none shadow-2xl rounded-3xl relative overflow-hidden group">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">Master this Topic</h3>
                  </div>
                  <p className="text-white/80 font-medium mb-6 max-w-sm mx-auto">
                    AI-powered flashcards to help you master {classItem.subject}.
                  </p>
                  <Button
                    onClick={() =>
                      navigate(`/flashcards/${classItem.id}`, {
                        state: {
                          source: "todays_classes",
                          subject: classItem.subject,
                          topic: aiTopicDetails?.mainTopic || classItem.recentTopic || classItem.subject,
                          grade: classItem.grade,
                        },
                      })
                    }
                    className="w-full bg-white hover:bg-gray-100 text-blue-700 font-bold py-7 text-lg rounded-2xl shadow-xl border-none"
                  >
                    <BookOpen className="w-6 h-6 mr-3" />
                    Start Learning Now
                  </Button>
                </div>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
