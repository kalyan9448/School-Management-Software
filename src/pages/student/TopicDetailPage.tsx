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
} from "lucide-react";

import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { homeworkTopics, todaysClasses, studentData } from "@/data/studentMockData";
import { AITopicChat } from "@/components/student/modules/AITopicChat";
import { aiService } from "@/services/aiService";

export function TopicDetailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();

  // State to track flashcard completion dynamically
  const [flashcardCompleted, setFlashcardCompleted] = useState(false);
  const [flashcardProgress, setFlashcardProgress] = useState(0);

  // State to track questions completion dynamically
  const [questionsAttempted, setQuestionsAttempted] = useState(0);
  const [questionsProgress, setQuestionsProgress] = useState(0);
  const [questionsCompleted, setQuestionsCompleted] = useState(false);
  const [questionsAccuracy, setQuestionsAccuracy] = useState<number | null>(null);

  // Find the homework topic
  const topic = homeworkTopics.find((t) => t.id === Number(topicId));

  // Find corresponding class data for curriculum overview
  const classData = todaysClasses.find((c) => c.subject === topic?.subject);

  const [aiTopicDetails, setAiTopicDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchAIOverview() {
      if (topic) {
        setIsGenerating(true);
        try {
          const overview = await aiService.generateSubjectOverview(
            topic.subject, 
            topic.topic, 
            studentData.grade
          );
          if (overview) {
            setAiTopicDetails(overview);
          }
        } catch (error) {
          console.error("AI Overview generation failed for topic:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    }
    fetchAIOverview();
  }, [topic?.id]);

  // Merge AI details with base topic details
  const topicDetails = aiTopicDetails || classData?.topicDetails;

  // Check localStorage for flashcard completion status on mount
  useEffect(() => {
    const checkFlashcardCompletion = () => {
      if (topic) {
        const storageKey = `flashcard_completed_${topic.id}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            console.log("Loaded flashcard completion from localStorage:", data);
            setFlashcardCompleted(data.completed || false);
            setFlashcardProgress(data.progress || 0);
          } catch (error) {
            console.error("Error parsing flashcard data from localStorage:", error);
          }
        } else {
          // Use initial values from topic data
          setFlashcardCompleted(topic.flashcardsCompleted || false);
          setFlashcardProgress(topic.flashcardProgress || 0);
        }
      }
    };

    // Check on mount
    checkFlashcardCompletion();

    // Also check when window regains focus (user comes back from flashcards)
    const handleFocus = () => {
      console.log("Window focused, checking flashcard completion...");
      checkFlashcardCompletion();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [topic?.id, topic?.flashcardsCompleted, topic?.flashcardProgress, location.pathname]);

  // Check localStorage for questions completion status
  useEffect(() => {
    const checkQuestionsCompletion = () => {
      if (topic) {
        const storageKey = `questions_completed_${topic.id}`;
        const savedData = localStorage.getItem(storageKey);

        if (savedData) {
          try {
            const data = JSON.parse(savedData);
            setQuestionsProgress(
              ((data.questionsAttempted || 0) / topic.totalQuestions) * 100
            );
            setQuestionsCompleted(data.completed || false);
            setQuestionsAccuracy(data.accuracy || null);
          } catch (error) {
            console.error("Error parsing questions data from localStorage:", error);
          }
        } else {
          // Use initial values from topic data
          setQuestionsAttempted(topic.questionsAttempted || 0);
          setQuestionsProgress(topic.questionsProgress || 0);
          setQuestionsCompleted(topic.questionsCompleted || false);
          setQuestionsAccuracy(topic.accuracy);
        }
      }
    };

    // Check on mount
    checkQuestionsCompletion();

    // Also check when window regains focus
    const handleFocus = () => {
      console.log("Window focused, checking questions completion...");
      checkQuestionsCompletion();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [topic?.id, topic?.questionsAttempted, topic?.questionsCompleted, topic?.accuracy, topic?.totalQuestions, location.pathname]);

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
        className="text-white p-6 md:p-8 lg:p-10 rounded-b-[2rem] md:rounded-b-[2.5rem] shadow-xl relative overflow-hidden mb-6 md:mb-8"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
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

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-300 font-bold uppercase tracking-widest text-[10px] md:text-xs mb-2">
                <Brain className="w-4 h-4" />
                Adaptive Learning Path
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">{topic.subject}</h1>
              <p className="text-lg md:text-xl text-white/90 font-semibold">{topic.topic}</p>
            </div>
            
            <div className="flex gap-3 md:gap-4">
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
        {topicDetails && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 md:p-10 border-none bg-gradient-to-br from-white via-white to-purple-50/30 shadow-[0_20px_50px_rgba(0,0,0,0.06)] rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1.5 md:w-2 h-full bg-purple-500 opacity-20" />
              <div className="absolute -right-20 -top-20 w-64 h-64 bg-purple-100/30 rounded-full blur-3xl invisible md:visible" />
              
              <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 relative z-10 text-center md:text-left">
                <div className="w-14 h-14 md:w-16 md:h-16 bg-purple-50 rounded-2xl md:rounded-3xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-sm flex-shrink-0">
                  <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-purple-600" />
                </div>
                <div className="flex-1 w-full">
                  <div className="flex flex-col md:flex-row items-center justify-between mb-4 gap-3">
                    <h2 className="text-xl md:text-2xl font-black text-[#1A1A1A] tracking-tight">
                      {aiTopicDetails ? "AI-Enhanced Learning Guide" : "Curriculum-Based Topic Overview"}
                    </h2>
                    {aiTopicDetails && (
                      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200 border-none px-3 py-1 rounded-full flex items-center gap-1.5 transition-colors">
                        <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
                        <span className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider">Powered by AI</span>
                      </Badge>
                    )}
                  </div>
                  
                  {isGenerating ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <div className="h-4 bg-gray-100 rounded-full w-full animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-[90%] animate-pulse" />
                        <div className="h-4 bg-gray-100 rounded-full w-[80%] animate-pulse" />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4 md:gap-6 pt-4">
                        <div className="h-40 bg-gray-50 rounded-3xl animate-pulse" />
                        <div className="h-40 bg-gray-50 rounded-3xl animate-pulse" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[#4A5568] leading-relaxed text-base md:text-lg font-medium">
                        {topicDetails.description}
                      </p>
                      
                      <div className="p-4 md:p-6 bg-gray-50/50 rounded-2xl md:rounded-3xl border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-gray-200" />
                        <p className="text-[#7A869A] leading-relaxed text-xs md:text-sm italic font-medium">
                          {topicDetails.overview || topicDetails.pedagogicalSummary}
                        </p>
                      </div>
                      
                      {/* Objectives & Key Points Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 pt-4 text-left">
                        {/* Objectives Sub-Card */}
                        <div className="p-5 md:p-6 rounded-2xl md:rounded-[2rem] bg-emerald-50/50 border border-emerald-100/50 hover:bg-emerald-50 transition-colors group/card">
                          <h4 className="font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-emerald-700 flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-emerald-100 rounded-lg group-hover/card:scale-110 transition-transform">
                              <Target className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            Learning Objectives
                          </h4>
                          <ul className="space-y-3">
                            {topicDetails.learningObjectives?.map((obj: string, i: number) => (
                              <li key={i} className="text-xs md:text-sm font-semibold text-[#4A5568] flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                                <span className="flex-1">{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Key Points Sub-Card */}
                        <div className="p-5 md:p-6 rounded-2xl md:rounded-[2rem] bg-amber-50/50 border border-amber-100/50 hover:bg-amber-50 transition-colors group/card">
                          <h4 className="font-bold text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-amber-700 flex items-center gap-2 mb-4">
                            <div className="p-1.5 bg-amber-100 rounded-lg group-hover/card:scale-110 transition-transform">
                              <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4" />
                            </div>
                            Key Concept Mastery
                          </h4>
                          <ul className="space-y-3">
                            {topicDetails.keyPoints?.map((pt: string, i: number) => (
                              <li key={i} className="text-xs md:text-sm font-semibold text-[#4A5568] flex items-start gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                                <span className="flex-1">{pt}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
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
              onClick={() => navigate(`/flashcards/${topic.id}`, { state: { source: 'homework' } })}
              className="w-full h-16 rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 outline-none transition-all active:scale-95 group relative overflow-hidden bg-blue-600 hover:bg-blue-700 border-none"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="flex items-center justify-center gap-2 relative z-10 text-white w-full">
                <BookOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>{flashcardProgress > 0 ? "Continue" : "Start"} Flashcards</span>
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
                !questionsLocked && navigate(`/objective-questions/${topic.id}`)
              }
              disabled={questionsLocked}
              variant={questionsLocked ? "secondary" : "default"}
              className={`w-full h-16 rounded-2xl font-bold text-lg outline-none transition-all active:scale-95 ${questionsLocked
                  ? "bg-gray-200 !text-gray-500 cursor-not-allowed border-none shadow-none"
                  : "bg-blue-600 hover:bg-blue-700 !text-white shadow-xl shadow-blue-100 border-none relative overflow-hidden group/btn"
                }`}
              size="lg"
            >
              {!questionsLocked && <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>}
              <div className="flex items-center justify-center gap-2 relative z-10 w-full">
                {questionsLocked ? (
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

              {topic.mistakePatterns.length > 0 && (
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
      <AITopicChat topicName={topic.topic} subjectName={topic.subject} />
    </div>
  );
}