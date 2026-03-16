import { motion } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/student/ui/button";
import { Card } from "@/components/student/ui/card";
import { useState } from "react";

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="mb-6"
    >
      <Card style={{ background: 'linear-gradient(to right, #1F6FEB, #0A2540)' }} className="p-4 text-white border-0">
        <div className="flex items-start gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold mb-1">Welcome to Your Learning Dashboard! 🎉</h3>
            <p className="text-sm text-white/90">
              Track your progress, take quizzes, and master new topics as you learn.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="text-white hover:bg-white/20 -mt-1 -mr-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}