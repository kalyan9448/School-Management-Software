import { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Clock,
  Target,
  Home,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Input } from "@/components/student/ui/input";
import { Progress } from "@/components/student/ui/progress";
import { Badge } from "@/components/student/ui/badge";
import { QuizService, StudentProfile } from "@/services/student/studentDataService";
import { useNavigate } from "react-router";

type Answer = number | string | boolean | null;

export function QuizPage() {
  const navigate = useNavigate();
  
  // State to track quiz regeneration
  const [quizKey, setQuizKey] = useState(0);
  
  // Shuffle and select random questions on mount or retry
  const [shuffledQuestions] = useState(() => {
    const allQuestions = QuizService.getAll();
    const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(10, shuffled.length)); // Take up to 10 random questions
  });
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>(new Array(shuffledQuestions.length).fill(null));
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [fillBlankAnswer, setFillBlankAnswer] = useState("");

  // Save result when quiz is completed
  useEffect(() => {
    if (quizCompleted) {
      const score = calculateScore();
      const percentage = Math.round((score / shuffledQuestions.length) * 100);
      
      QuizService.saveResult({
        score,
        total: shuffledQuestions.length,
        percentage,
        duration: timeElapsed,
        date: new Date().toISOString(),
        answers: answers.reduce((acc, ans, idx) => {
          acc[shuffledQuestions[idx].id] = ans;
          return acc;
        }, {} as Record<number, any>)
      });
      
      console.log("Quiz result saved via QuizService");
    }
  }, [quizCompleted]);

  const currentQuestion = shuffledQuestions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / shuffledQuestions.length) * 100;

  // Timer
  useEffect(() => {
    if (!quizCompleted) {
      const timer = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [quizCompleted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswer = (answer: Answer) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    setShowResult(true);
  };

  const handleFillBlankSubmit = () => {
    if (fillBlankAnswer.trim()) {
      handleAnswer(fillBlankAnswer.trim());
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < shuffledQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowResult(false);
      setShowExplanation(false);
      setFillBlankAnswer("");
    } else {
      setQuizCompleted(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowResult(false);
      setShowExplanation(false);
      setFillBlankAnswer("");
    }
  };

  const isCorrectAnswer = (answer: Answer) => {
    if (currentQuestion.type === "mcq") {
      return answer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "true-false") {
      return answer === currentQuestion.correctAnswer;
    } else if (currentQuestion.type === "fill-blank") {
      return (
        typeof answer === "string" &&
        answer.toLowerCase() === String(currentQuestion.correctAnswer).toLowerCase()
      );
    }
    return false;
  };

  const calculateScore = () => {
    let correct = 0;
    answers.forEach((answer, index) => {
      const question = shuffledQuestions[index];
      if (question.type === "mcq") {
        if (answer === question.correctAnswer) correct++;
      } else if (question.type === "true-false") {
        if (answer === question.correctAnswer) correct++;
      } else if (question.type === "fill-blank") {
        if (
          typeof answer === "string" &&
          answer.toLowerCase() === String(question.correctAnswer).toLowerCase()
        ) {
          correct++;
        }
      }
    });
    return correct;
  };

  const handleRestart = () => {
    setQuizKey(prev => prev + 1); // Regenerate quiz
    setCurrentQuestionIndex(0);
    setAnswers(new Array(shuffledQuestions.length).fill(null));
    setShowResult(false);
    setShowExplanation(false);
    setQuizCompleted(false);
    setTimeElapsed(0);
    setFillBlankAnswer("");
  };

  const currentAnswer = answers[currentQuestionIndex];
  const isAnswered = currentAnswer !== null;
  const isCorrect = isAnswered && isCorrectAnswer(currentAnswer);

  // Results Screen
  if (quizCompleted) {
    const score = calculateScore();
    const percentage = Math.round((score / shuffledQuestions.length) * 100);

    return (
      <div className="min-h-screen pb-24" style={{ background: '#FAFBFF' }}>
        <div style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} className="text-white p-6 rounded-b-3xl shadow-lg mb-6">
          <div className="max-w-screen-xl mx-auto">
            <h1 className="text-2xl font-bold">Quiz Complete! 🎉</h1>
          </div>
        </div>

        <div className="max-w-screen-xl mx-auto px-4 space-y-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
          >
            <Card className="p-8 text-center bg-gradient-to-br from-purple-50 to-pink-50">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-6 rounded-full">
                  <CheckCircle className="w-16 h-16 text-white" />
                </div>
              </motion.div>

              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {percentage >= 80 ? "Excellent Work!" : percentage >= 60 ? "Good Job!" : "Keep Practicing!"}
              </h2>

              <div className="flex items-center justify-center gap-2 mb-6">
                <Target className="w-6 h-6 text-purple-400" />
                <span className="text-5xl font-bold text-purple-600">{percentage}%</span>
                <Target className="w-6 h-6 text-purple-400" />
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Target className="w-6 h-6 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{score}</p>
                  <p className="text-sm text-gray-600">Correct</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm">
                  <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{formatTime(timeElapsed)}</p>
                  <p className="text-sm text-gray-600">Time</p>
                </div>
                 <div className="bg-white p-4 rounded-xl shadow-sm">
                  <CheckCircle className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-gray-900">{percentage}%</p>
                  <p className="text-sm text-gray-600">Score</p>
                </div>
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Retry Quiz
                </Button>
                <Button
                  onClick={() => navigate("/dashboard")}
                  variant="outline"
                  className="border-purple-600 text-purple-600 hover:bg-purple-50"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </Card>
          </motion.div>

          {/* Review Answers */}
          <Card className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Review Your Answers</h3>
            <div className="space-y-4">
              {shuffledQuestions.map((question, index) => {
                const userAnswer = answers[index];
                const isCorrect =
                  question.type === "mcq"
                    ? userAnswer === question.correctAnswer
                    : question.type === "true-false"
                    ? userAnswer === question.correctAnswer
                    : typeof userAnswer === "string" &&
                      userAnswer.toLowerCase() === String(question.correctAnswer).toLowerCase();

                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border-2 ${
                      isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-1" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-1" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-2">
                          {index + 1}. {question.question}
                        </p>
                        {question.type === "mcq" && question.options && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-700">
                              Your answer:{" "}
                              <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                                {question.options[userAnswer as number] || "Not answered"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-gray-700">
                                Correct answer:{" "}
                                <span className="text-green-700">
                                  {question.options[question.correctAnswer as number]}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                        {question.type === "true-false" && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-700">
                              Your answer:{" "}
                              <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                                {userAnswer !== null ? String(userAnswer) : "Not answered"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-gray-700">
                                Correct answer:{" "}
                                <span className="text-green-700">
                                  {String(question.correctAnswer)}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                        {question.type === "fill-blank" && (
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-700">
                              Your answer:{" "}
                              <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                                {userAnswer || "Not answered"}
                              </span>
                            </p>
                            {!isCorrect && (
                              <p className="text-gray-700">
                                Correct answer:{" "}
                                <span className="text-green-700">{String(question.correctAnswer)}</span>
                              </p>
                            )}
                          </div>
                        )}
                        <p className="text-sm text-gray-600 mt-2 italic">{question.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz Question Screen
  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAFBFF' }}>
      {/* Header */}
      <div style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} className="text-white p-6 rounded-b-3xl shadow-lg mb-6">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Retention Quiz</h1>
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock className="w-4 h-4" />
              <span className="font-bold">{formatTime(timeElapsed)}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>
                Question {currentQuestionIndex + 1} of {shuffledQuestions.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 mb-6">
              {/* Question Header */}
              <div className="flex items-center justify-between mb-6">
                <Badge
                  variant="outline"
                  className={
                    currentQuestion.difficulty === "easy"
                      ? "bg-green-50 text-green-700 border-green-200"
                      : currentQuestion.difficulty === "medium"
                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                      : "bg-red-50 text-red-700 border-red-200"
                  }
                >
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="secondary" className="capitalize">
                  {currentQuestion.type === "mcq"
                    ? "Multiple Choice"
                    : currentQuestion.type === "true-false"
                    ? "True/False"
                    : "Fill in the Blank"}
                </Badge>
              </div>

              {/* Question */}
              <h2 className="text-xl font-bold text-gray-900 mb-6">{currentQuestion.question}</h2>

              {/* Answer Options */}
              <div className="space-y-3">
                {currentQuestion.type === "mcq" && currentQuestion.options && (
                  <>
                    {currentQuestion.options.map((option, index) => {
                      const isSelected = currentAnswer === index;
                      const isCorrectOption = index === currentQuestion.correctAnswer;
                      const showCorrect = showResult && isCorrectOption;
                      const showWrong = showResult && isSelected && !isCorrectOption;

                      return (
                        <motion.button
                          key={index}
                          whileHover={{ scale: showResult ? 1 : 1.02 }}
                          whileTap={{ scale: showResult ? 1 : 0.98 }}
                          onClick={() => !showResult && handleAnswer(index)}
                          disabled={showResult}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            showCorrect
                              ? "bg-green-50 border-green-500"
                              : showWrong
                              ? "bg-red-50 border-red-500"
                              : isSelected
                              ? "bg-purple-50 border-purple-500"
                              : "bg-white border-gray-200 hover:border-purple-300"
                          } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                showCorrect
                                  ? "bg-green-500 text-white"
                                  : showWrong
                                  ? "bg-red-500 text-white"
                                  : isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span className="flex-1 font-medium text-gray-900">{option}</span>
                            {showCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                            {showWrong && <XCircle className="w-6 h-6 text-red-500" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </>
                )}

                {currentQuestion.type === "true-false" && (
                  <>
                    {[true, false].map((value) => {
                      const isSelected = currentAnswer === value;
                      const isCorrectOption = value === currentQuestion.correctAnswer;
                      const showCorrect = showResult && isCorrectOption;
                      const showWrong = showResult && isSelected && !isCorrectOption;

                      return (
                        <motion.button
                          key={String(value)}
                          whileHover={{ scale: showResult ? 1 : 1.02 }}
                          whileTap={{ scale: showResult ? 1 : 0.98 }}
                          onClick={() => !showResult && handleAnswer(value)}
                          disabled={showResult}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            showCorrect
                              ? "bg-green-50 border-green-500"
                              : showWrong
                              ? "bg-red-50 border-red-500"
                              : isSelected
                              ? "bg-purple-50 border-purple-500"
                              : "bg-white border-gray-200 hover:border-purple-300"
                          } ${showResult ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                                showCorrect
                                  ? "bg-green-500 text-white"
                                  : showWrong
                                  ? "bg-red-500 text-white"
                                  : isSelected
                                  ? "bg-purple-500 text-white"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {value ? "T" : "F"}
                            </div>
                            <span className="flex-1 font-medium text-gray-900">
                              {value ? "True" : "False"}
                            </span>
                            {showCorrect && <CheckCircle className="w-6 h-6 text-green-500" />}
                            {showWrong && <XCircle className="w-6 h-6 text-red-500" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </>
                )}

                {currentQuestion.type === "fill-blank" && (
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        type="text"
                        placeholder="Type your answer here..."
                        value={fillBlankAnswer}
                        onChange={(e) => setFillBlankAnswer(e.target.value)}
                        disabled={showResult}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !showResult) {
                            handleFillBlankSubmit();
                          }
                        }}
                      />
                      {!showResult && (
                        <Button
                          onClick={handleFillBlankSubmit}
                          disabled={!fillBlankAnswer.trim()}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          Submit
                        </Button>
                      )}
                    </div>
                    {showResult && (
                      <div
                        className={`p-4 rounded-lg ${
                          isCorrect ? "bg-green-50" : "bg-red-50"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {isCorrect ? (
                            <>
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <span className="font-semibold text-green-900">Correct!</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-5 h-5 text-red-600" />
                              <span className="font-semibold text-red-900">Incorrect</span>
                            </>
                          )}
                        </div>
                        {!isCorrect && (
                          <p className="text-sm text-gray-700">
                            Correct answer: <strong>{String(currentQuestion.correctAnswer)}</strong>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Explanation */}
              {showResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="mt-6 p-4 bg-blue-50 rounded-lg border-2 border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-blue-900 mb-1">Explanation</h4>
                      <p className="text-sm text-blue-800">{currentQuestion.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>

            {/* Navigation */}
            <div className="flex gap-3">
              <Button
                onClick={handlePrevious}
                disabled={currentQuestionIndex === 0}
                variant="outline"
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300"
              >
                {currentQuestionIndex === shuffledQuestions.length - 1 ? "Finish" : "Next"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}