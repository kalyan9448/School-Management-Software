import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Target,
  Clock,
  ChevronRight,
  Lock,
} from "lucide-react";

import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { type HomeworkTopic } from "@/data/studentMockData";
import { HomeworkService, StudentProfile } from "@/services/student/studentDataService";
import { PerformanceRewardScreen } from "@/components/student/modules/PerformanceRewardScreen";
import { aiService } from "@/services/aiService";
import { useAIFeatureEnabled } from "@/hooks/useAIFeatureEnabled";

export function ObjectiveQuestionsPage() {
  const navigate = useNavigate();
  const { topicId } = useParams<{ topicId: string }>();
  const { isEnabled: isAIEnabled, isLoading: isAILoading, getDisabledMessage } = useAIFeatureEnabled();
  
  // State to trigger question regeneration
  const [quizKey, setQuizKey] = useState(0);
  
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic data from Firestore (async)
  const [studentData, setStudentData] = useState<any>({ name: "", grade: "" });
  const [topicDetails, setTopicDetails] = useState<HomeworkTopic | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const [profile, allTopics] = await Promise.all([
        StudentProfile.get(),
        HomeworkService.getAll(),
      ]);
      setStudentData(profile);
      setTopicDetails(allTopics.find((t: any) => t.id === Number(topicId)));
    })();
  }, [topicId]);

  useEffect(() => {
    async function loadQuiz() {
      if (isAILoading) {
        return; // Wait for AI check to complete
      }

      if (!isAIEnabled) {
        setIsLoading(false);
        return;
      }
      
      if (topicDetails) {
        setIsLoading(true);
        try {
          const generatedQuestions = await aiService.generateQuiz(
            topicDetails.subject, 
            topicDetails.topic, 
            studentData.grade,
            5
          );
          // ensure they have IDs
          const questionsWithIds = generatedQuestions.map((q, idx) => ({...q, id: idx + 1}));
          setQuestions(questionsWithIds);
        } catch (error) {
          console.error("Failed to generate quiz", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    loadQuiz();
  }, [topicDetails, quizKey, isAIEnabled, isAILoading]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showResults, setShowResults] = useState(false);

  // Sync answers array when questions load
  useEffect(() => {
    if (questions.length > 0) {
      setAnswers(new Array(questions.length).fill(null));
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setShowResults(false);
    }
  }, [questions]);

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  // Calculate results
  const correctAnswers = questions.length > 0 ? answers.filter(
    (ans, idx) => idx < questions.length && ans === questions[idx]?.correctAnswer
  ).length : 0;
  const accuracy = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Save quiz completion when results are shown
  useEffect(() => {
    if (showResults && topicId && questions.length > 0) {
      (async () => {
        await HomeworkService.updateQuestionsProgress(
          Number(topicId),
          questions.length,
          correctAnswers,
          questions.length
        );
        
        const savedAnswers = questions.map((q, idx) => ({
          questionId: q.id,
          selectedAnswer: answers[idx] ?? -1,
          isCorrect: answers[idx] === q.correctAnswer,
        }));

        const detailedData = {
          completed: true,
          questionsAttempted: questions.length,
          totalQuestions: questions.length,
          correctAnswers,
          accuracy,
          timestamp: new Date().toISOString(),
          answers: savedAnswers,
          questionIds: questions.map((q: any) => q.id),
          questions: questions,
        };

        await HomeworkService.saveDetailedResults(Number(topicId), detailedData);
      })();
    }
  }, [showResults, topicId, questions, correctAnswers, accuracy, answers]);

  const handleAnswerSelect = (optionIndex: number) => {
    if (showExplanation) return;
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = selectedAnswer;
    setAnswers(newAnswers);
    setShowExplanation(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setShowResults(true);
    }
  };

  const isCorrect = currentQuestion && selectedAnswer === currentQuestion.correctAnswer;
  const timeSpent = Math.round((Date.now() - startTime) / 1000);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4">
        <Target className="w-16 h-16 text-emerald-500 animate-pulse mb-6" />
        <h2 className="text-2xl font-black text-[#1A1A1A] mb-2 tracking-tight">AI is crafting your quiz</h2>
        <p className="text-[#4A5568] font-medium text-lg">Analyzing topic: {topicDetails?.topic}...</p>
        <div className="w-48 h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 animate-[pulse_2s_ease-in-out_infinite] w-full" />
        </div>
      </div>
    );
  }

  // Show disabled message if AI features are not enabled
  if (!isAIEnabled && !isAILoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF]">
        <div 
          className="text-white p-6 md:p-10 lg:p-12 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative mb-8"
          style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 mb-4 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="max-w-2xl mx-auto px-4 md:px-8 lg:px-12">
          <Card className="border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 p-8">
            <div className="flex items-center justify-center mb-4">
              <Lock className="w-12 h-12 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">AI Features Disabled</h2>
            <p className="text-gray-600 text-center mb-4">{getDisabledMessage()}</p>
            <p className="text-sm text-gray-500 text-center">Please contact your school administrator to enable AI features.</p>
          </Card>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-[#7A869A] mb-6">No questions available for this topic.</p>
          <Button 
            onClick={() => navigate("/homework")} 
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Homework
          </Button>
        </Card>
      </div>
    );
  }

  // Results Screen - Use Performance Reward Screen
  if (showResults) {
    const timeFormatted = `${Math.floor(timeSpent / 60)}m ${timeSpent % 60}s`;

    return (
      <PerformanceRewardScreen
        score={accuracy}
        correctAnswers={correctAnswers}
        totalQuestions={questions.length}
        previousScore={null}
        subject={topicDetails?.subject || "Unknown Subject"}
        topic={topicDetails?.topic || "Unknown Topic"}
        topicId={topicId || ""}
        onRetry={undefined}
        onReviewMistakes={() => {
          // Navigate to review mistakes page
          navigate(`/review-mistakes/${topicId}`);
        }}
        onBackToTopic={() => navigate(`/homework/${topicId}`)}
        timeSpent={timeFormatted}
      />
    );
  }

  // Quiz Screen
  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-10 lg:p-12 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative mb-8"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem] md:rounded-b-[3rem]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/homework/${topicId}`)}
            className="text-white hover:bg-white/10 mb-4 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Exit Quiz
          </Button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-1">Objective Quiz</h1>
              <div className="flex items-center gap-2 text-white/80">
                <Clock className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-medium">Question {currentQuestionIndex + 1} of {questions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="w-fit bg-white/15 backdrop-blur-md text-white border-white/20 px-4 py-2 rounded-xl text-sm font-semibold">
                <Target className="w-4 h-4 mr-2" />
                Accuracy: {accuracy}%
              </Badge>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-sm mb-2 text-white/90 font-semibold px-1">
              <span>Quiz Progress</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-md">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2.5 bg-white/10 border border-white/5" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question Card */}
            <Card className="p-6 md:p-10 mb-8 border-[#E6ECF5] bg-white shadow-lg rounded-[2rem] md:rounded-[2.5rem] overflow-hidden relative">
              <div className="absolute top-0 left-0 w-2 h-full bg-blue-600 opacity-20" />
              <div className="flex items-center gap-3 mb-6">
                <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border-blue-100 px-3 py-1 rounded-full">
                  {currentQuestion.category}
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }`}
                >
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-[#1A1A1A] mb-8 leading-tight tracking-tight">
                {currentQuestion.question}
              </h2>

              {/* Options */}
              <div className="space-y-4">
                {currentQuestion.options.map((option: string, index: number) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectOption = index === currentQuestion.correctAnswer;
                  const showCorrect = showExplanation && isCorrectOption;
                  const showIncorrect = showExplanation && isSelected && !isCorrect;

                  return (
                    <motion.button
                      key={index}
                      whileHover={{ scale: showExplanation ? 1 : 1.01 }}
                      whileTap={{ scale: showExplanation ? 1 : 0.99 }}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={showExplanation}
                      className={`w-full p-5 text-left rounded-2xl border-2 transition-all duration-300 relative overflow-hidden group ${
                        showCorrect
                          ? "bg-emerald-50 border-emerald-500 shadow-sm"
                          : showIncorrect
                          ? "bg-red-50 border-red-500 shadow-sm"
                          : isSelected
                          ? "bg-blue-50 border-blue-600 shadow-md"
                          : "bg-white border-gray-100 hover:border-blue-200 hover:bg-gray-50/50"
                      } ${showExplanation ? "cursor-default" : "cursor-pointer"}`}
                    >
                      <div className="flex items-start md:items-center gap-4 relative z-10">
                        <div
                          className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 mt-0.5 md:mt-0 transition-all duration-300 ${
                            showCorrect
                              ? "bg-emerald-500 border-emerald-500"
                              : showIncorrect
                              ? "bg-red-500 border-red-500"
                              : isSelected
                              ? "bg-blue-600 border-blue-600"
                              : "border-gray-200 group-hover:border-blue-300"
                          }`}
                        >
                          {showCorrect ? (
                            <CheckCircle className="w-5 h-5 text-white" />
                          ) : showIncorrect ? (
                            <XCircle className="w-5 h-5 text-white" />
                          ) : isSelected ? (
                            <div className="w-2.5 h-2.5 bg-white rounded-full" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400 group-hover:text-blue-500">{String.fromCharCode(65 + index)}</span>
                          )}
                        </div>
                        <span
                          className={`text-base font-semibold ${
                            showCorrect
                              ? "text-emerald-900"
                              : showIncorrect
                              ? "text-red-900"
                              : isSelected
                              ? "text-blue-900"
                              : "text-[#4A5568]"
                          }`}
                        >
                          {option}
                        </span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </Card>

            {/* Explanation */}
            <AnimatePresence>
              {showExplanation && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                >
                  <Card
                    className={`p-5 md:p-8 mb-8 border-none rounded-[2rem] ${
                      isCorrect
                        ? "bg-emerald-50 text-emerald-900 shadow-lg shadow-emerald-100/50"
                        : "bg-red-50 text-red-900 shadow-lg shadow-red-100/50"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-xl flex-shrink-0 ${isCorrect ? "bg-emerald-500" : "bg-red-500"}`}>
                        {isCorrect ? (
                          <CheckCircle className="w-6 h-6 text-white" />
                        ) : (
                          <XCircle className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-lg mb-2 tracking-tight">
                          {isCorrect ? "Excellent! That's correct." : "Not quite right..."}
                        </h3>
                        <p className="text-sm font-medium leading-relaxed opacity-80">
                          {currentQuestion.explanation}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action Button */}
            <div className="flex gap-4">
              {!showExplanation ? (
                <Button
                  onClick={handleSubmitAnswer}
                  disabled={selectedAnswer === null}
                  className="flex-1 h-14 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-100 transition-all active:scale-95 border-none"
                  size="lg"
                >
                  Submit Answer
                </Button>
              ) : (
                <Button
                  onClick={handleNextQuestion}
                  className="flex-1 h-14 bg-[#0A2540] hover:bg-blue-900 text-white text-lg font-bold rounded-2xl shadow-lg transition-all active:scale-95 group"
                  size="lg"
                >
                  {currentQuestionIndex < questions.length - 1
                    ? "Next Question"
                    : "Finish Quiz"}
                  <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform inline" />
                </Button>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}