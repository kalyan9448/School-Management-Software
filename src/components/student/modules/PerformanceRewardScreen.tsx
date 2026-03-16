import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  ArrowUp,
  Target,
  BookOpen,
  RotateCcw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { useEffect, useState } from "react";

interface PerformanceRewardScreenProps {
  score: number; // Percentage (0-100)
  correctAnswers: number;
  totalQuestions: number;
  previousScore?: number | null;
  subject: string;
  topic: string;
  topicId: string; // Add topicId for navigation
  onRetry: () => void;
  onReviewMistakes: () => void;
  onBackToTopic: () => void;
  timeSpent: string;
}

type PerformanceLevel = "outstanding" | "improvement" | "good" | "needs-improvement";

export function PerformanceRewardScreen({
  score,
  correctAnswers,
  totalQuestions,
  previousScore,
  subject,
  topic,
  topicId, // Add topicId for navigation
  onRetry,
  onReviewMistakes,
  onBackToTopic,
  timeSpent,
}: PerformanceRewardScreenProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  // Determine performance level
  const getPerformanceLevel = (): PerformanceLevel => {
    if (score >= 90) return "outstanding";
    if (previousScore !== null && previousScore !== undefined && score > previousScore) {
      return "improvement";
    }
    if (score >= 70) return "good";
    return "needs-improvement";
  };

  const performanceLevel = getPerformanceLevel();
  const improvement = previousScore !== null && previousScore !== undefined ? score - previousScore : null;

  // Handle animations
  useEffect(() => {
    if (performanceLevel === "outstanding") {
      setShowConfetti(true);
    }

    // Stop confetti after 4 seconds
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [performanceLevel, showConfetti]);


  // Performance config
  const performanceConfig = {
    outstanding: {
      title: "Excellent Work!",
      subtitle: "You've mastered this topic!",
      message: "Exceptional performance! You've shown a deep understanding of the concepts.",
      color: "from-blue-600 to-blue-800",
      bgColor: "from-blue-50 to-blue-100",
      icon: CheckCircle,
      iconColor: "text-blue-600",
      badgeColor: "bg-blue-600",
    },
    improvement: {
      title: "Great Progress!",
      subtitle: "Your scores are improving!",
      message: "Well done! Your consistent effort is showing in your results.",
      color: "from-indigo-400 to-indigo-600",
      bgColor: "from-indigo-50 to-indigo-100",
      icon: TrendingUp,
      iconColor: "text-indigo-500",
      badgeColor: "bg-indigo-500",
    },
    good: {
      title: "Good Job!",
      subtitle: "Solid performance!",
      message: "Nice work! You have a good grasp of the material.",
      color: "from-emerald-400 to-emerald-600",
      bgColor: "from-emerald-50 to-emerald-100",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
      badgeColor: "bg-emerald-500",
    },
    "needs-improvement": {
      title: "Keep Practicing!",
      subtitle: "Every challenge is a chance to learn.",
      message: "Review the concepts and try again. You'll get it with more practice!",
      color: "from-gray-400 to-gray-600",
      bgColor: "from-gray-50 to-gray-100",
      icon: BookOpen,
      iconColor: "text-gray-500",
      badgeColor: "bg-gray-500",
    },
  };

  const config = performanceConfig[performanceLevel];
  const PerformanceIcon = config.icon;

  return (
    <div className="min-h-screen bg-[#FAFBFF] pb-24">

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Reward Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        >
          <Card
            className={`p-8 bg-gradient-to-br ${config.bgColor} border-2 border-gray-200 shadow-2xl mb-6`}
          >
            {/* Performance Icon with Animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.6, type: "spring", delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <div
                className={`p-6 rounded-full bg-gradient-to-br ${config.color} shadow-xl`}
              >
                <PerformanceIcon className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            {/* Title and Subtitle */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-center mb-6"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {config.title}
              </h1>
              <p className="text-lg text-gray-600">{config.subtitle}</p>
              <p className="text-sm text-gray-500 mt-2">{config.message}</p>
            </motion.div>

            {/* Score Display */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="flex justify-center mb-6"
            >
              <div className="text-center">
                <div className="relative inline-block">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {/* Background circle */}
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="#E5E7EB"
                      strokeWidth="8"
                      fill="none"
                    />
                    {/* Progress circle */}
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke={`url(#gradient-${performanceLevel})`}
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: score / 100 }}
                      transition={{ duration: 1.5, delay: 0.6 }}
                      style={{
                        strokeDasharray: "351.858",
                        strokeDashoffset: 0,
                      }}
                    />
                    <defs>
                      <linearGradient
                        id={`gradient-${performanceLevel}`}
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                          performanceLevel === "outstanding"
                              ? "#2563EB"
                              : performanceLevel === "improvement"
                              ? "#4F46E5"
                              : performanceLevel === "good"
                              ? "#10B981"
                              : "#6B7280"
                          }
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            performanceLevel === "outstanding"
                              ? "#1E40AF"
                              : performanceLevel === "improvement"
                              ? "#3730A3"
                              : performanceLevel === "good"
                              ? "#059669"
                              : "#374151"
                          }
                        />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {score}%
                    </span>
                    <span className="text-xs text-gray-500">Score</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
                <CheckCircle className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {correctAnswers}/{totalQuestions}
                </p>
                <p className="text-xs text-gray-600">Correct Answers</p>
              </div>
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 text-center">
                <Target className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">
                  {totalQuestions}
                </p>
                <p className="text-xs text-gray-600">Total Questions</p>
              </div>
            </motion.div>

            {/* Improvement Indicator */}
            {improvement !== null && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-white/70 backdrop-blur-sm rounded-xl p-4 mb-6"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">
                      Previous Score
                    </p>
                    <p className="text-xl font-bold text-gray-700">
                      {previousScore}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {improvement > 0 ? (
                      <>
                        <ArrowUp className="w-8 h-8 text-green-500" />
                        <span className="text-2xl font-bold text-green-500">
                          +{improvement}%
                        </span>
                      </>
                    ) : improvement < 0 ? (
                      <span className="text-2xl font-bold text-red-500">
                        {improvement}%
                      </span>
                    ) : (
                      <span className="text-2xl font-bold text-gray-500">
                        0%
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Score</p>
                    <p className="text-xl font-bold text-gray-900">{score}%</p>
                  </div>
                </div>
              </motion.div>
            )}


            {/* Additional Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-6"
            >
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Subject:</span>
                  <span className="font-semibold text-gray-900">{subject}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-gray-600" />
                  <span className="text-gray-600">Time:</span>
                  <span className="font-semibold text-gray-900">
                    {timeSpent}
                  </span>
                </div>
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold">Topic:</span> {topic}
                </p>
              </div>
            </motion.div>
          </Card>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1 }}
          className="space-y-3"
        >
          {/* Primary Action */}
          {performanceLevel === "outstanding" || performanceLevel === "good" ? (
            <Button
              onClick={onBackToTopic}
              className="w-full h-14 bg-gradient-to-r from-[#1F6FEB] to-[#0A2540] hover:from-[#0A2540] hover:to-[#1F6FEB] text-white text-base font-semibold shadow-lg"
              size="lg"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Continue Learning
            </Button>
          ) : (
            <Button
              onClick={onReviewMistakes}
              className="w-full h-14 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white text-base font-semibold shadow-lg"
              size="lg"
            >
              <AlertCircle className="w-5 h-5 mr-2" />
              Review Mistakes
            </Button>
          )}

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={onRetry}
              variant="outline"
              className="h-12 border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white font-semibold"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Quiz
            </Button>
            <Button
              onClick={onBackToTopic}
              variant="outline"
              className="h-12 border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold"
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Back to Topic
            </Button>
          </div>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-6 text-center"
        >
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-none">
            <p className="text-sm italic text-gray-700">
              {performanceLevel === "outstanding" &&
                '"Excellence is not a destination; it is a continuous journey that never ends." - Brian Tracy'}
              {performanceLevel === "improvement" &&
                '"The only impossible journey is the one you never begin." - Tony Robbins'}
              {performanceLevel === "good" &&
                '"Success is the sum of small efforts repeated day in and day out." - Robert Collier'}
              {performanceLevel === "needs-improvement" &&
                '"Don\'t watch the clock; do what it does. Keep going." - Sam Levenson'}
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}