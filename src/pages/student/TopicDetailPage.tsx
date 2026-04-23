import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Lock,
  CheckCircle,
  AlertCircle,
  Brain,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  Globe,
  ChevronRight,
  Zap,
  MapPin,
} from "lucide-react";

import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { type HomeworkTopic } from "@/data/studentMockData";
import { HomeworkService, TodaysClasses, StudentProfile, getCurriculumTags, StudentLearningContextService } from "@/services/student/studentDataService";
import { AITopicChat } from "@/components/student/modules/AITopicChat";
import { aiService } from "@/services/aiService";
import { useAIFeatureEnabled } from "@/hooks/useAIFeatureEnabled";

export function TopicDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  const { isEnabled: isAIEnabled } = useAIFeatureEnabled();

  // State to track flashcard completion dynamically
  const [flashcardCompleted, setFlashcardCompleted] = useState(false);
  const [flashcardProgress, setFlashcardProgress] = useState(0);

  // State to track questions completion dynamically
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [questionsProgress, setQuestionsProgress] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [questionsAccuracy, setQuestionsAccuracy] = useState<number | null>(null);

  // Dynamic data from Firestore (async)
  const [studentData, setStudentData] = useState<any>({ name: "", grade: "" });
  const [allHomeworkTopics, setAllHomeworkTopics] = useState<HomeworkTopic[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [curriculumTags, setCurriculumTags] = useState<string[]>([]);


  useEffect(() => {
    (async () => {
      const [profile, topics, classes] = await Promise.all([
        StudentProfile.get(),
        HomeworkService.getAll(),
        TodaysClasses.getAll(),
      ]);
      setStudentData(profile);
      setAllHomeworkTopics(topics);
      setAllClasses(classes);
    })();
  }, [topicId]);

  // Find the target topic
  const topic = allHomeworkTopics.find((t: any) => t.id === Number(topicId));

  // Find corresponding class data for curriculum overview
  const classData = allClasses.find((c: any) => c.subject === topic?.subject);

  useEffect(() => {
    if (topic?.subject) {
      (async () => {
        const tags = await getCurriculumTags(topic.subject);
        setCurriculumTags(tags);
      })();
    }
  }, [topic?.subject]);


  const [aiTopicDetails, setAiTopicDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchAIOverview() {
      if (!topic) return;
      setIsGenerating(true);
      try {
        if (isAIEnabled) {
          // Build full student context, passing already-known accuracy + flashcard progress
          const ctx = await StudentLearningContextService.get(
            topic.subject,
            topic.topic,
            flashcardProgress,
            questionsAccuracy
          );
          const overview = await aiService.generateStudentConceptOverview(
            topic.subject,
            topic.topic,
            ctx
          );
          if (overview) setAiTopicDetails(overview);
        } else {
          // Fallback without AI
          const tags = await getCurriculumTags(topic.subject);
          setCurriculumTags(tags);
          setAiTopicDetails({
            mainTopic: topic.topic,
            description: `Learn about ${topic.topic} in ${topic.subject}.`,
            overview: `Explore the topic of ${topic.topic} as part of your ${topic.subject} curriculum.`,
            deepExplanation: "",
            learningObjectives: [],
            keyPoints: [],
            ageAppropriateAnalogy: null,
            stepByStepBreakdown: [],
            commonMisconceptions: [],
            curriculumFocus: "",
            realWorldConnections: [],
            encouragement: "Keep going!",
            difficultyLevel: "standard",
          });
        }
      } catch (error) {
        console.error("AI Overview generation failed for topic:", error);
      } finally {
        setIsGenerating(false);
      }
    }
    fetchAIOverview();
  }, [topic?.id, isAIEnabled]);

  // Merge AI details with base topic details
  const topicDetails = aiTopicDetails || classData?.topicDetails;

  // Check progress on mount and whenever window regains focus
  useEffect(() => {
    const refreshProgress = async () => {
      if (topicId) {
        const currentTopic = await HomeworkService.getById(Number(topicId));
        if (currentTopic) {
          setFlashcardProgress(currentTopic.flashcardProgress);
          setFlashcardCompleted(currentTopic.flashcardsCompleted);
          setQuestionsAttempted(currentTopic.questionsAttempted);
          setQuestionsProgress(currentTopic.questionsProgress);
          setQuestionsCompleted(currentTopic.questionsCompleted);
          setQuestionsAccuracy(currentTopic.accuracy);
        }
      }
    };

    refreshProgress();

    const handleFocus = () => {
      refreshProgress();
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [topicId, location.pathname]);

  if (!topic) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-[#7A869A] mb-6">Topic not found.</p>
          <Button
            onClick={() => navigate("/homework")}
            className="bg-blue-600 hover:bg-blue-900 text-white"
          >
            Back to Homework
          </Button>
        </Card>
      </div>
    );
  }

  const questionsLocked = !flashcardCompleted;

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-8 lg:p-10 rounded-b-[2rem] md:rounded-b-[2.5rem] shadow-xl relative mb-6 md:mb-8"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem] md:rounded-b-[2.5rem]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/homework")}
            className="text-white hover:bg-white/10 mb-4 md:mb-6 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Homework
          </Button>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-2">
                <Brain className="w-4 h-4" />
                Adaptive Learning Path
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{topic.subject}</h1>
              <p className="text-lg md:text-xl text-white/90 font-semibold">{topic.topic}</p>
            </div>
            
            <div className="flex items-center gap-3 md:gap-4 md:self-end">
              <div className="bg-white/15 backdrop-blur-md rounded-xl md:rounded-2xl px-4 md:px-5 py-2 md:py-3 border border-white/20 shadow-xl flex-1 md:flex-none text-center md:text-left">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5 md:mb-1">Flashcards</p>
                <p className="text-xl md:text-2xl font-black">{flashcardProgress}%</p>
              </div>
              <div className="bg-white/15 backdrop-blur-md rounded-xl md:rounded-2xl px-4 md:px-5 py-2 md:py-3 border border-white/20 shadow-xl flex-1 md:flex-none text-center md:text-left">
                <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-white/70 mb-0.5 md:mb-1">Accuracy</p>
                <p className="text-xl md:text-2xl font-black">{questionsAccuracy !== null ? `${questionsAccuracy}%` : "--"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 space-y-8">
        {/* Curriculum Overview / AI Guide */}
        {/* AI Overview Section */}
        {isGenerating ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="p-8 flex flex-col items-center justify-center gap-3">
              <div className="relative">
                <Brain className="w-10 h-10 text-purple-300 animate-pulse" />
                <Sparkles className="w-4 h-4 text-purple-500 absolute -top-1 -right-1 animate-bounce" />
              </div>
              <p className="text-gray-700 font-semibold">Generating your personalized guide...</p>
              <p className="text-gray-400 text-sm">Analyzing your quiz history, flashcard progress & curriculum</p>
              <div className="w-full max-w-sm space-y-2 mt-2">
                <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-4/5 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full w-3/5 animate-pulse" />
              </div>
            </Card>
          </motion.div>
        ) : aiTopicDetails && (
          <div className="space-y-4">
            {/* Description + encouragement */}
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
              <Card className="p-6 md:p-8 border-none bg-gradient-to-br from-white to-purple-50/30 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500 opacity-20 rounded-l-3xl" />
                <div className="flex flex-col md:flex-row items-start gap-4">
                  <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-7 h-7 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <h2 className="text-xl font-black text-[#1A1A1A] tracking-tight">AI-Enhanced Learning Guide</h2>
                      <Badge className="bg-purple-100 text-purple-700 border-none px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Powered by AI</span>
                      </Badge>
                      {aiTopicDetails.difficultyLevel && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          aiTopicDetails.difficultyLevel === 'simplified' ? 'bg-green-100 text-green-700 border-green-200' :
                          aiTopicDetails.difficultyLevel === 'advanced' ? 'bg-rose-100 text-rose-700 border-rose-200' :
                          'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {aiTopicDetails.difficultyLevel === 'simplified' ? 'Simplified for you' :
                           aiTopicDetails.difficultyLevel === 'advanced' ? 'Advanced level' : 'Standard level'}
                        </span>
                      )}
                    </div>
                    <p className="text-[#4A5568] leading-relaxed font-medium">{aiTopicDetails.description}</p>
                    {aiTopicDetails.encouragement && (
                      <p className="mt-3 text-purple-600 text-sm font-semibold italic">✨ {aiTopicDetails.encouragement}</p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Deep Explanation */}
            {(aiTopicDetails.overview || aiTopicDetails.deepExplanation) && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <Card className="p-6 md:p-8 border-none bg-white shadow-md rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-50 rounded-xl"><Brain className="w-5 h-5 text-blue-600" /></div>
                    <h3 className="font-black text-gray-900">Deep Concept Explanation</h3>
                  </div>
                  <p className="text-gray-600 leading-relaxed">{aiTopicDetails.overview || aiTopicDetails.pedagogicalSummary}</p>
                  {aiTopicDetails.deepExplanation && (
                    <div className="mt-4 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-gray-700 text-sm leading-relaxed">{aiTopicDetails.deepExplanation}</p>
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {/* Analogy */}
            {aiTopicDetails.ageAppropriateAnalogy && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className="p-5 bg-amber-50 border border-amber-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    <h4 className="font-black text-amber-900 text-sm uppercase tracking-wider">Think of It This Way</h4>
                  </div>
                  <p className="text-amber-800 text-sm font-medium italic leading-relaxed">"{aiTopicDetails.ageAppropriateAnalogy}"</p>
                </Card>
              </motion.div>
            )}

            {/* Step-by-Step Breakdown */}
            {aiTopicDetails.stepByStepBreakdown?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                <Card className="p-6 border-none bg-white shadow-md rounded-3xl">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-emerald-50 rounded-xl"><Zap className="w-5 h-5 text-emerald-600" /></div>
                    <h3 className="font-black text-gray-900">Step-by-Step Breakdown</h3>
                  </div>
                  <div className="space-y-3">
                    {aiTopicDetails.stepByStepBreakdown.map((item: any, i: number) => (
                      <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">{i + 1}</div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.step}</p>
                          <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">{item.explanation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Objectives & Key Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-left">
              {aiTopicDetails.learningObjectives?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                  <Card className="p-5 bg-emerald-50/50 border border-emerald-100/50 rounded-2xl h-full">
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2 mb-3">
                      <Target className="w-3.5 h-3.5" /> Learning Objectives
                    </h4>
                    <ul className="space-y-2">
                      {aiTopicDetails.learningObjectives.map((obj: string, i: number) => (
                        <li key={i} className="text-xs font-semibold text-[#4A5568] flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}
              {aiTopicDetails.keyPoints?.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                  <Card className="p-5 bg-amber-50/50 border border-amber-100/50 rounded-2xl h-full">
                    <h4 className="font-bold text-[10px] uppercase tracking-[0.2em] text-amber-700 flex items-center gap-2 mb-3">
                      <Lightbulb className="w-3.5 h-3.5" /> Key Concept Mastery
                    </h4>
                    <ul className="space-y-2">
                      {aiTopicDetails.keyPoints.map((pt: string, i: number) => (
                        <li key={i} className="text-xs font-semibold text-[#4A5568] flex items-start gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                          {pt}
                        </li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>
              )}
            </div>

            {/* Misconceptions — only shown after quiz attempt */}
            {questionsAccuracy !== null && aiTopicDetails.commonMisconceptions?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card className="p-5 bg-rose-50/60 border border-rose-100 rounded-2xl shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <h4 className="font-black text-rose-900 text-sm">Watch Out For These Mistakes</h4>
                  </div>
                  <div className="space-y-2">
                    {aiTopicDetails.commonMisconceptions.map((item: any, i: number) => (
                      <div key={i} className="p-3 bg-white rounded-xl border border-rose-100">
                        <p className="text-rose-700 text-xs font-semibold mb-1">❌ {item.misconception}</p>
                        <p className="text-emerald-700 text-xs font-medium">✅ {item.correction}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            )}

            {/* Curriculum Focus */}
            {aiTopicDetails.curriculumFocus && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}>
                <Card className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-black text-indigo-900 text-sm">Curriculum Focus</h4>
                  </div>
                  <p className="text-indigo-700 text-xs leading-relaxed">{aiTopicDetails.curriculumFocus}</p>
                </Card>
              </motion.div>
            )}

            {/* Real World Connections */}
            {aiTopicDetails.realWorldConnections?.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
                <Card className="p-4 bg-teal-50/50 border border-teal-100 rounded-2xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Globe className="w-4 h-4 text-teal-600" />
                    <h4 className="font-black text-teal-900 text-sm">Real-World Connections</h4>
                  </div>
                  <ul className="space-y-1">
                    {aiTopicDetails.realWorldConnections.map((conn: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-teal-800 font-medium">
                        <ChevronRight className="w-3.5 h-3.5 text-teal-500 flex-shrink-0 mt-0.5" />{conn}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            )}
          </div>
        )}

        {/* Flashcards Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 md:p-8 border-none bg-gradient-to-br from-blue-50 to-white shadow-[0_20px_50px_rgba(31,111,235,0.08)] rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between mb-6 md:mb-8 gap-4 text-center md:text-left">
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
                <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform">
                  <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-1 tracking-tight">
                    Step 1: Master the Flashcards
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />
                    <p className="text-xs md:text-sm font-semibold text-emerald-600/70">
                      AI-generated flashcards based on today's topic
                    </p>
                  </div>
                </div>
              </div>
              {flashcardCompleted && (
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between text-sm mb-3 font-black uppercase tracking-widest text-[#7A869A] px-1">
                <span>Learning Progress</span>
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                  {flashcardProgress}%
                </span>
              </div>
              <Progress value={flashcardProgress} className="h-2.5 bg-emerald-100/50" />
            </div>

            <Button
              onClick={() => navigate(`/flashcards/${topic.id}`, { 
                state: { 
                  source: 'homework',
                  subject: topic.subject,
                  topic: topic.topic,
                  grade: studentData.grade,
                } 
              })}
              disabled={flashcardCompleted}
              className={`w-full h-16 rounded-2xl font-bold text-lg outline-none transition-all active:scale-95 group relative overflow-hidden border-none ${
                flashcardCompleted
                  ? "bg-emerald-100 !text-emerald-700 cursor-default shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100"
              }`}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-center gap-2 relative z-10 w-full">
                {flashcardCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Flashcards Completed</span>
                  </>
                ) : (
                  <>
                    <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    <span>{flashcardProgress > 0 ? "Continue" : "Start"} Flashcards</span>
                  </>
                )}
              </div>
            </Button>
          </Card>
        </motion.div>

        {/* Objective Questions Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card
            className={`p-6 md:p-8 border-none shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group ${questionsLocked
                ? "bg-gray-50 opacity-100"
                : "bg-gradient-to-br from-emerald-50 to-white"
              }`}
          >

            <div className={`flex flex-col md:flex-row items-center md:items-start justify-between mb-6 md:mb-8 gap-4 text-center md:text-left ${questionsLocked ? "opacity-60" : ""}`}>
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
                <div
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg transition-all ${questionsLocked ? "bg-gray-300 shadow-gray-100" : "bg-emerald-500 shadow-emerald-100 group-hover:rotate-6"
                    }`}
                >
                  <Target className={`w-6 h-6 md:w-7 md:h-7 ${questionsLocked ? "text-gray-500" : "text-white"}`} />
                </div>
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-[#1A1A1A] mb-1 tracking-tight">
                    Step 2: Attempt Objective Quiz
                  </h3>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    {questionsLocked ? <Lock className="w-3.5 h-3.5 md:w-4 md:h-4 text-gray-500" /> : <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500" />}
                    <p className="text-xs md:text-sm font-semibold text-[#7A869A]">
                      {questionsLocked
                        ? "Locked until Flashcards are complete"
                        : "Test your understanding with AI-generated questions"}
                    </p>
                  </div>
                </div>
              </div>
              {questionsCompleted && (
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
              )}
            </div>

            {questionsLocked ? (
              <div className="mb-6 md:mb-8 p-5 md:p-6 bg-white/60 rounded-2xl md:rounded-[2rem] border border-gray-200 text-center flex flex-col items-center">
                <Lock className="w-7 h-7 md:w-8 md:h-8 text-gray-400 mb-2 md:mb-3" />
                <p className="text-sm font-bold text-gray-900 mb-1">Content Locked</p>
                <p className="text-[11px] md:text-xs text-gray-500 leading-relaxed font-medium max-w-[200px] md:max-w-xs mx-auto">
                  Master the flashcards completely to unlock Step 2 and test your knowledge.
                </p>
              </div>
            ) : (
              <div className="mb-8">
                <div className="flex items-center justify-between text-sm mb-3 font-black uppercase tracking-widest text-[#7A869A] px-1">
                  <span>Quiz Accuracy</span>
                  <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {questionsAccuracy !== null ? `${questionsAccuracy}%` : "Not Attempted"}
                  </span>
                </div>
                <Progress value={questionsProgress} className="h-2.5 bg-emerald-100/50" />
              </div>
            )}

            <Button
              onClick={() =>
                !questionsLocked && !questionsCompleted && navigate(`/objective-questions/${topic.id}`, {
                  state: { subject: topic.subject, topic: topic.topic, grade: studentData.grade }
                })
              }
              disabled={questionsLocked || questionsCompleted}
              variant={questionsLocked || questionsCompleted ? "secondary" : "default"}
              className={`w-full h-16 rounded-2xl font-bold text-lg outline-none transition-all active:scale-95 ${questionsCompleted
                  ? "bg-emerald-100 !text-emerald-700 cursor-not-allowed border-none shadow-none"
                  : questionsLocked
                  ? "bg-gray-200 !text-gray-500 cursor-not-allowed border-none shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 !text-white shadow-xl shadow-blue-100 border-none relative overflow-hidden group/btn"
                }`}
              size="lg"
            >
              {!questionsLocked && !questionsCompleted && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>}
              <div className="flex items-center justify-center gap-2 relative z-10 w-full">
                {questionsCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>Assessment Completed</span>
                  </>
                ) : questionsLocked ? (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Locked Section</span>
                  </>
                ) : (
                  <>
                    <Target className="w-5 h-5" />
                    <span>{questionsAttempted > 0 ? "Continue" : "Start"} Assessment</span>
                  </>
                )}
              </div>
            </Button>
          </Card>
        </motion.div>

        {/* Performance Summary */}
        {questionsAccuracy !== null && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6 border-[#E6ECF5] bg-white shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Performance Summary
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-purple-700">Accuracy</p>
                  </div>
                  <p className="text-2xl font-bold text-purple-900">
                    {questionsAccuracy}%
                  </p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Target className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-blue-700">Completed</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">
                    {questionsAttempted}/{topic.totalQuestions}
                  </p>
                </div>
              </div>

              {topic.mistakePatterns && topic.mistakePatterns.length > 0 && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Brain className="w-4 h-4 text-orange-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-orange-900 mb-1">
                        AI-Detected Patterns
                      </p>
                      <ul className="text-xs text-orange-700 space-y-1">
                        {topic.mistakePatterns.map((pattern, idx) => (
                          <li key={idx}>• {pattern}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </div>

      {/* AI Topic Chat - Floating Button */}
      <AITopicChat 
        topicName={topic.topic} 
        subjectName={topic.subject} 
        studentLevel={studentData.grade}
        curriculumTags={curriculumTags}
      />

    </div>
  );
}