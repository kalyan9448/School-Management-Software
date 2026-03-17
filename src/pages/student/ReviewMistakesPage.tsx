import { motion } from "motion/react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  BookOpen,
  Target,
  TrendingUp,
  Lightbulb,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { HomeworkService, ObjectiveQuestions } from "@/services/student/studentDataService";

interface SavedAnswer {
  questionId: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

interface QuizData {
  completed: boolean;
  questionsAttempted: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timestamp: string;
  answers?: SavedAnswer[];
  questionIds?: number[];
  questions?: any[]; // Added this
}

export function ReviewMistakesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();

  // Get quiz data from our centralized service
  const quizData = HomeworkService.getDetailedResults(Number(topicId)) as QuizData | undefined;
  
  if (!quizData) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">No Quiz Data Found</h2>
          <p className="text-gray-600 mb-6">
            Complete the quiz first to review your mistakes.
          </p>
          <Button
            onClick={() => navigate(`/homework/${topicId}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Back to Topic
          </Button>
        </Card>
      </div>
    );
  }

  // Find the target topic
  const allHomeworkTopics = HomeworkService.getAll();
  const topic = allHomeworkTopics.find((t) => t.id === Number(topicId));
  
  // Get the actual question objects
  const allObjectiveQuestions = ObjectiveQuestions.getAll();
  const savedAnswers = quizData.answers || [];
  const savedQuestions = quizData.questions || [];
  
  const wrongAnswers = savedAnswers
    .filter(ans => !ans.isCorrect)
    .map(ans => {
      // Look in saved questions first, then fallback to global questions
      const questionFound = savedQuestions.find(q => q.id === ans.questionId) || 
                           allObjectiveQuestions.find(q => q.id === ans.questionId);
      return {
        question: questionFound,
        savedAnswer: ans
      };
    })
    .filter(item => item.question !== undefined);

  const wrongCount = wrongAnswers.length;
  const correctCount = quizData.correctAnswers;
  const totalCount = quizData.totalQuestions;

  return (
    <div className="min-h-screen bg-[#FAFBFF] pb-24">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-8 lg:p-10 rounded-b-[2.5rem] shadow-xl relative sticky top-0 z-20"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2.5rem]">
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
            Back to Topic
          </Button>

          <div className="flex items-center justify-between mb-2">
            <div className="flex-1">
              <h1 className="text-3xl font-bold tracking-tight mb-1">Review Mistakes</h1>
              <div className="flex items-center gap-2 text-white/80">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <p className="text-sm md:text-base font-semibold">{topic?.subject} • {topic?.topic}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-white/15 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/20 shadow-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/70 mb-1">Final Score</p>
                <p className="text-3xl font-black">{quizData.accuracy}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="p-8 bg-gradient-to-br from-orange-50 to-red-50 border-none shadow-xl rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-30 -mr-16 -mt-16" />
            <div className="flex items-start gap-6 relative z-10">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl flex items-center justify-center shadow-lg shadow-orange-200/50 group-hover:rotate-6 transition-transform">
                <AlertCircle className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">
                  Mistakes Analysis
                </h2>
                <p className="text-sm font-medium text-gray-700 mb-6 leading-relaxed">
                  Reviewing mistakes is the fastest way to learn. Let's break down where you can improve your understanding.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-red-100">
                    <XCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-red-700">{wrongCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-500/50">To Fix</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-emerald-100">
                    <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-emerald-700">{correctCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/50">Correct</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm border border-blue-100">
                    <Target className="w-5 h-5 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-black text-blue-700">{totalCount}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500/50">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* No mistakes case */}
        {wrongCount === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-8 text-center bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Perfect Score! 🎉
              </h2>
              <p className="text-gray-700 mb-6">
                You answered all questions correctly! There are no mistakes to review.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => navigate(`/homework/${topicId}`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Back to Topic
                </Button>
                <Button
                  onClick={() => navigate(`/questions/${topicId}`)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white"
                >
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Retry Quiz
                </Button>
              </div>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Learning Tip */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-none rounded-2xl group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 group-hover:rotate-12 transition-transform">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 tracking-tight uppercase">
                      Pro Learning Tip
                    </p>
                    <p className="text-sm font-medium text-gray-600">
                      Read each explanation carefully—understanding "why" prevents repeating mistakes.
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Wrong Answers */}
            {wrongAnswers.map((item, index) => {
              const question = item.question!;
              const savedAnswer = item.savedAnswer;

              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card className="p-6 border-2 border-red-200 bg-white shadow-sm">
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <XCircle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            Question {index + 1} of {wrongCount}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {question.category}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              question.difficulty === "easy"
                                ? "bg-green-50 text-green-700 border-green-200"
                                : question.difficulty === "medium"
                                ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                : "bg-red-50 text-red-700 border-red-200"
                            }`}
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <h3 className="font-bold text-gray-900 text-lg">
                          {question.question}
                        </h3>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-4 mb-6">
                      {question.options.map((option: string, optionIndex: number) => {
                        const isCorrectOption = optionIndex === question.correctAnswer;
                        const wasSelected = optionIndex === savedAnswer.selectedAnswer;

                        return (
                          <div
                            key={optionIndex}
                            className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                              isCorrectOption
                                ? "bg-emerald-50 border-emerald-500 shadow-sm"
                                : wasSelected
                                ? "bg-red-50 border-red-500 shadow-sm"
                                : "bg-gray-50 border-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center flex-shrink-0 ${
                                  isCorrectOption
                                    ? "bg-emerald-500 border-emerald-500"
                                    : wasSelected
                                    ? "bg-red-500 border-red-500"
                                    : "border-gray-200 bg-white"
                                }`}
                              >
                                {isCorrectOption ? (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                ) : wasSelected ? (
                                  <XCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <span className="text-xs font-bold text-gray-400">{String.fromCharCode(65 + optionIndex)}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p
                                  className={`text-base font-semibold ${
                                    isCorrectOption
                                      ? "text-emerald-900"
                                      : wasSelected
                                      ? "text-red-900"
                                      : "text-[#4A5568]"
                                  }`}
                                >
                                  {option}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-semibold text-blue-900 mb-1">
                            Explanation
                          </p>
                          <p className="text-sm text-blue-800">
                            {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>

                  </Card>
                </motion.div>
              );
            })}
          </>
        )}

        {/* Action Buttons */}
        {wrongCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + wrongCount * 0.1 }}
            className="grid grid-cols-2 gap-4 pt-4"
          >
            <Button
              onClick={() => navigate(`/questions/${topicId}`)}
              className="h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-bold text-lg rounded-2xl shadow-xl shadow-blue-100 border-none transition-all active:scale-95 group"
              size="lg"
            >
              <TrendingUp className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
              Retry Quiz
            </Button>
            <Button
              onClick={() => navigate(`/homework/${topicId}`)}
              variant="outline"
              className="h-16 border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-bold text-lg rounded-2xl transition-all active:scale-95"
              size="lg"
            >
              <BookOpen className="w-6 h-6 mr-3" />
              Back to Topic
            </Button>
          </motion.div>
        )}

        {/* Study Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 + wrongCount * 0.1 }}
        >
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
            <p className="text-sm italic text-gray-700 text-center">
              "Mistakes are proof that you are trying. Learn from them and come back
              stronger!" 💪
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
