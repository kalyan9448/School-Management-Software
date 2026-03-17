import { motion } from "motion/react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle,
  Target,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { TodaysClasses, StudentProfile, Flashcards as FlashcardService } from "@/services/student/studentDataService";
import { aiService } from "@/services/aiService";

export function SubjectDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  
  // Dynamic data from localStorage
  const studentData = StudentProfile.get();
  const allClasses = TodaysClasses.getAll();

  // Find the class data by ID
  const classItem = allClasses.find((c: any) => c.id === Number(id));

  const [aiTopicDetails, setAiTopicDetails] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchAIOverview() {
      if (classItem && classItem.topics && classItem.topics[0]) {
        setIsGenerating(true);
        try {
          const overview = await aiService.generateSubjectOverview(
            classItem.subject, 
            classItem.topics[0], 
            studentData.grade
          );
          if (overview) {
            setAiTopicDetails(overview);
          }
        } catch (error) {
          console.error("AI Overview generation failed:", error);
        } finally {
          setIsGenerating(false);
        }
      }
    }
    fetchAIOverview();
  }, [classItem?.id]);

  // Use AI details if generated, otherwise fall back to mock data
  const topicDetails = aiTopicDetails || classItem?.topicDetails;
  const flashcardsAvailable = FlashcardService.getBySubject(classItem?.subject || "");

  // If no class data, show error
  if (!classItem) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-[#7A869A] mb-6">Class not found. Please select a subject from the dashboard.</p>
          <Button 
            onClick={() => navigate("/")} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-10 lg:p-12 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative overflow-hidden"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold mb-2 tracking-tight">{classItem.subject}</h1>
              {topicDetails && (
                <div className="flex items-center gap-2 text-white/80">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  <p className="text-sm md:text-base font-medium">{topicDetails.mainTopic}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6 pb-24">
        {/* Check if topicDetails exists */}
        {!topicDetails ? (
          <Card className="p-6">
            <p className="text-[#7A869A]">Topic details are not available for this subject.</p>
          </Card>
        ) : (
          <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">
              {/* Left Column: Main Overview (2/3 width) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Topic Overview Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6 md:p-10 border-[#E6ECF5] bg-white shadow-lg rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative group">
                    <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-blue-50 rounded-2xl">
                        <BookOpen className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-[#1A1A1A] mb-3 tracking-tight">
                          Topic Overview
                        </h2>
                        <p className="text-[#4A5568] leading-relaxed font-medium">
                          {topicDetails.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* AI-Generated Overview */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <Card className="p-6 md:p-10 border-[#E6ECF5] bg-gradient-to-br from-indigo-50/50 to-white shadow-lg rounded-[2rem] md:rounded-[2.5rem] border-l-4 border-l-purple-500">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="p-3 bg-purple-50 rounded-2xl">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                            AI Learning Guide
                          </h3>
                        </div>
                        <p className="text-[#4A5568] leading-relaxed font-medium italic">
                          "{topicDetails.overview}"
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>

              {/* Right Column: Objectives & Key Points (1/3 width) */}
              <div className="space-y-6 mt-6 lg:mt-0">
                {/* Learning Objectives */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-8 border-[#E6ECF5] bg-white shadow-lg rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-green-50 rounded-2xl">
                        <Target className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                        Objectives
                      </h3>
                    </div>
                    <ul className="space-y-4">
                      {topicDetails.learningObjectives.map((objective: string, index: number) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          className="flex items-start gap-4"
                        >
                          <div className="mt-1 bg-green-100 rounded-full p-0.5">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          </div>
                          <span className="text-[#4A5568] text-sm font-semibold">{objective}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </Card>
                </motion.div>

                {/* Key Points */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-8 border-[#E6ECF5] bg-white shadow-lg rounded-3xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-amber-50 rounded-2xl">
                        <Lightbulb className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-bold text-[#1A1A1A] tracking-tight">
                        Key Points
                      </h3>
                    </div>
                    <div className="space-y-4">
                      {topicDetails.keyPoints.map((point: string, index: number) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 + index * 0.05 }}
                          className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-blue-100 transition-colors"
                        >
                          <div className="w-7 h-7 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-md">
                            {index + 1}
                          </div>
                          <p className="text-[#4A5568] text-sm font-semibold leading-relaxed">{point}</p>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>

            {/* View Flashcards Button - Centered on desktop */}
            {flashcardsAvailable.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
                className="lg:max-w-2xl lg:mx-auto pt-8"
              >
                <Card 
                  className="p-8 bg-gradient-to-br from-blue-600 to-blue-800 border-none shadow-2xl rounded-3xl relative overflow-hidden group"
                >
                  {/* Decorative backgrounds */}
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  
                  <div className="relative z-10 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3">
                      <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                        <Sparkles className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-white tracking-tight">
                        Master this Topic
                      </h3>
                    </div>
                    <p className="text-white/80 font-medium mb-6 max-w-sm mx-auto">
                      Review {flashcardsAvailable.length} personalized flashcards powered by AI to lock in your knowledge.
                    </p>
                    <Button
                      onClick={() => {
                        console.log("Navigating to flashcards for class ID:", classItem.id);
                        navigate(`/flashcards/${classItem.id}`, { state: { source: 'todays_classes' } });
                      }}
                      className="w-full bg-white hover:bg-gray-100 text-blue-700 font-bold py-7 text-lg rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all border-none"
                    >
                      <BookOpen className="w-6 h-6 mr-3" />
                      Start Learning Now
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
