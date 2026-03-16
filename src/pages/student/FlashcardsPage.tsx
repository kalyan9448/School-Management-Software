import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  ArrowLeft,
  RotateCcw,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Target,
  Sparkles,
  CheckCircle,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { homeworkTopics, todaysClasses, studentData } from "@/data/studentMockData";
import { aiService } from "@/services/aiService";

export function FlashcardsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { topicId } = useParams<{ topicId: string }>();
  
  const source = location.state?.source || 'homework';
  
  // Find data from either todaysClasses or homeworkTopics
  const classItem = todaysClasses.find((c) => c.id === Number(topicId));
  const homeworkTopic = homeworkTopics.find((t) => t.id === Number(topicId));
  
  // Use subject from classItem or homeworkTopic
  const decodedSubject = classItem?.subject || homeworkTopic?.subject || "";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);
  const [reviewCards, setReviewCards] = useState<number[]>([]);
  const [flashcards, setFlashcards] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Find the corresponding homework topic for navigation
  const currentTopic = homeworkTopic || homeworkTopics.find((t) => t.subject === decodedSubject);

  useEffect(() => {
    async function loadFlashcards() {
      if (decodedSubject && currentTopic?.topic) {
        setIsLoading(true);
        try {
          const cards = await aiService.generateFlashcards(
            decodedSubject, 
            currentTopic.topic, 
            studentData.grade,
            10
          );
          // Add IDs to generated cards
          const cardsWithIds = cards.map((card, index) => ({ ...card, id: index + 1 }));
          setFlashcards(cardsWithIds);
        } catch (error) {
          console.error("Failed to load AI flashcards", error);
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }
    loadFlashcards();
  }, [decodedSubject, currentTopic?.topic]);

  const currentCard = flashcards[currentIndex];
  // Guard the variables since flashcards could be empty
  const progress = flashcards.length > 0 ? ((currentIndex + 1) / flashcards.length) * 100 : 0;
  const allCardsReviewed = flashcards.length > 0 && (knownCards.length + reviewCards.length === flashcards.length);
  const isLastCard = flashcards.length > 0 && currentIndex === flashcards.length - 1;
  const currentCardReviewed = currentCard && (knownCards.includes(currentCard.id) || reviewCards.includes(currentCard.id));

  // Save completion status to localStorage when all cards are reviewed
  useEffect(() => {
    if (allCardsReviewed && currentTopic) {
      localStorage.setItem(
        `flashcard_completed_${currentTopic.id}`,
        JSON.stringify({
          completed: true,
          progress: 100,
          knownCards: knownCards.length,
          reviewCards: reviewCards.length,
          timestamp: new Date().toISOString(),
        })
      );
      console.log("Flashcards completed! Saved to localStorage:", currentTopic.id);
    }
  }, [allCardsReviewed, currentTopic, knownCards.length, reviewCards.length]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex flex-col items-center justify-center p-4">
        <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-[#4A5568] font-medium text-lg animate-pulse">AI is generating your flashcards...</p>
      </div>
    );
  }

  if (!decodedSubject || flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAFBFF] flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <p className="text-[#7A869A] mb-2">
            {!decodedSubject 
              ? "No subject specified" 
              : `No flashcards available for ${decodedSubject}`}
          </p>
          <p className="text-[#7A869A] text-sm mb-6">
            Please select a subject from the dashboard to view flashcards.
          </p>
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

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleKnown = () => {
    if (currentCard && !knownCards.includes(currentCard.id)) {
      setKnownCards([...knownCards, currentCard.id]);
      // Remove from review if it was there
      setReviewCards(reviewCards.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  const handleNeedReview = () => {
    if (currentCard && !reviewCards.includes(currentCard.id)) {
      setReviewCards([...reviewCards, currentCard.id]);
      // Remove from known if it was there
      setKnownCards(knownCards.filter((id) => id !== currentCard.id));
    }
    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards([]);
    setReviewCards([]);
  };

  // Handle navigation to topic detail page
  const handleContinueToAssessment = () => {
    if (source === 'todays_classes') {
      console.log("Navigating back to dashboard");
      navigate("/student/dashboard");
    } else {
      if (currentTopic) {
        console.log("Navigating to topic:", currentTopic.id);
        navigate(`/homework/${currentTopic.id}`);
      } else {
        console.log("No topic found, going back");
        navigate(-1);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFBFF] pb-24">
      {/* Header */}
      <div 
        className="text-white p-6 md:p-8 lg:p-10 rounded-b-[2.5rem] shadow-xl relative overflow-hidden mb-8"
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        <div className="max-w-4xl mx-auto relative z-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="text-white hover:bg-white/10 mb-4 -ml-2 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight mb-1">{decodedSubject}</h1>
              <div className="flex items-center gap-2 text-white/80">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <p className="text-sm font-medium">AI-Generated Flashcards</p>
              </div>
            </div>
            <Badge className="bg-white/15 backdrop-blur-md text-white border-white/20 px-4 py-2 rounded-xl text-sm font-semibold">
              <BookOpen className="w-4 h-4 mr-2" />
              {flashcards.length} Cards
            </Badge>
          </div>

          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/10">
            <div className="flex items-center justify-between text-sm mb-2 text-white/90 font-semibold px-1">
              <span>Mastery Progress</span>
              <span className="bg-white/20 px-2 py-0.5 rounded-md">
                {currentIndex + 1} / {flashcards.length}
              </span>
            </div>
            <Progress value={progress} className="h-2.5 bg-white/10 border border-white/5" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Flashcard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div
            className="flex justify-center mb-8"
            onClick={() => setIsFlipped(!isFlipped)}
          >
              <motion.div
                key={`${currentIndex}-${isFlipped ? "back" : "front"}`}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full h-96 cursor-pointer"
              >
                <Card
                  className={`w-full h-full flex flex-col items-center justify-center p-10 text-center shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] border-2 transition-colors duration-300 overflow-hidden relative ${ 
                    isFlipped 
                      ? "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/30" 
                      : "bg-white text-[#1A1A1A] border-[#E6ECF5] hover:border-blue-200"
                  }`}
                >
                  {/* Decorative background for flipped state */}
                  {isFlipped && (
                    <div className="absolute inset-0 opacity-20 pointer-events-none">
                      <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -ml-16 -mt-16 blur-3xl" />
                      <div className="absolute bottom-0 right-0 w-32 h-32 bg-black rounded-full -mr-16 -mb-16 blur-3xl" />
                    </div>
                  )}

                  <Badge
                    className={`mb-6 border-none px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${ 
                      isFlipped
                        ? "bg-white/20 text-white backdrop-blur-sm"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    {isFlipped ? "Answer" : "Question"} • {currentCard.category}
                  </Badge>
                  
                  <div className="relative z-10 max-w-lg">
                    <p
                      className={`text-2xl md:text-3xl font-bold leading-tight tracking-tight ${ 
                        isFlipped ? "text-white" : "text-[#1A1A1A]"
                      }`}
                    >
                      {isFlipped ? currentCard.back : currentCard.front}
                    </p>
                  </div>
                  
                  <div className={`mt-10 flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                    isFlipped ? "bg-white/10 text-white/70" : "bg-gray-50 text-gray-400"
                  }`}>
                    <RotateCcw className="w-4 h-4" />
                    <p className="text-xs font-semibold uppercase tracking-widest">
                      {isFlipped ? "Tap to see question" : "Tap to reveal answer"}
                    </p>
                  </div>
                </Card>
              </motion.div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mb-8">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1 h-14 border-2 border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-blue-400 rounded-2xl font-bold transition-all shadow-sm"
          >
            <div className="flex items-center justify-center w-full">
              <ChevronLeft className="w-5 h-5 mr-2" />
              <span>Previous</span>
            </div>
          </Button>
          <Button
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 h-14 bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-200 rounded-2xl font-bold transition-all shadow-sm"
          >
            <div className="flex items-center justify-center w-full">
              <RotateCcw className="w-5 h-5 mr-2" />
              <span>Flip</span>
            </div>
          </Button>
          
          {isLastCard && currentCardReviewed ? (
            <Button
              onClick={handleContinueToAssessment}
              className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:scale-105 active:scale-95 text-white font-bold rounded-2xl shadow-lg transition-all"
            >
              {source === 'todays_classes' ? "Back to Dashboard" : "Continue"}
              <Target className="w-5 h-5 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentIndex === flashcards.length - 1}
              className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-md group border-none"
            >
              <div className="flex items-center justify-center w-full">
                <span>Next</span>
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </Button>
          )}
        </div>

        {/* Action Buttons */}
        {isFlipped && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="grid grid-cols-2 gap-4 mb-8"
          >
            <Button
              variant="outline"
              onClick={handleNeedReview}
              className="h-20 border-2 border-red-100 bg-red-50/50 hover:bg-red-50 hover:border-red-200 rounded-[2rem] transition-all group"
            >
              <div className="flex flex-col items-center">
                <X className="w-6 h-6 mb-1 text-red-500 group-hover:scale-125 transition-transform" />
                <span className="text-sm font-bold text-red-700">Need Review</span>
              </div>
            </Button>
            <Button
              onClick={handleKnown}
              className="h-20 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] shadow-lg shadow-emerald-200 transition-all group border-none"
            >
              <div className="flex flex-col items-center">
                <Check className="w-6 h-6 mb-1 text-white group-hover:scale-125 transition-transform" />
                <span className="text-sm font-bold">I Know This</span>
              </div>
            </Button>
          </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <Card className="p-5 border-none shadow-sm bg-emerald-50 text-center rounded-3xl">
            <p className="text-3xl font-black text-emerald-600 leading-none mb-1">
              {knownCards.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/60">Mastered</p>
          </Card>
          <Card className="p-5 border-none shadow-sm bg-amber-50 text-center rounded-3xl">
            <p className="text-3xl font-black text-amber-600 leading-none mb-1">
              {reviewCards.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/60">Review</p>
          </Card>
          <Card className="p-5 border-none shadow-sm bg-blue-50 text-center rounded-3xl">
            <p className="text-3xl font-black text-blue-600 leading-none mb-1">
              {flashcards.length - knownCards.length - reviewCards.length}
            </p>
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-700/60">Left</p>
          </Card>
        </motion.div>

        {/* Completion Card - Proceed to Step 2 */}
        {allCardsReviewed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-8 bg-gradient-to-br from-emerald-50 to-blue-50 border-none shadow-[0_20px_50px_rgba(16,185,129,0.1)] rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full blur-3xl opacity-50 -mr-16 -mt-16" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:rotate-6 transition-transform">
                    <CheckCircle className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
                      Topic Mastered! 🎉
                    </h3>
                    <p className="text-sm font-medium text-gray-600 leading-relaxed">
                      Outstanding effort! You've reviewed all {flashcards.length} cards. Your baseline knowledge is locked in.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 mb-8">
                  <div className="flex-1 p-5 bg-white/60 backdrop-blur-sm rounded-3xl text-center border border-white/40">
                    <p className="text-3xl font-black text-emerald-600 mb-1">{knownCards.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700/50">Cards Mastered</p>
                  </div>
                  <div className="flex-1 p-5 bg-white/60 backdrop-blur-sm rounded-3xl text-center border border-white/40">
                    <p className="text-3xl font-black text-amber-600 mb-1">{reviewCards.length}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-amber-700/50">For Review</p>
                  </div>
                </div>

                <Button
                  onClick={handleContinueToAssessment}
                  className="w-full h-16 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-200 transition-all hover:-translate-y-1 block border-none overflow-hidden relative group/btn"
                >
                  <div className="absolute inset-0 bg-white/10 translate-y-full group-hover/btn:translate-y-0 transition-transform" />
                  <div className="flex items-center justify-center relative z-10">
                    <Target className="w-6 h-6 mr-3" />
                    {source === 'todays_classes' ? "Return to Dashboard" : "Step 2: Objective Quiz"}
                    <Sparkles className="w-6 h-6 ml-3" />
                  </div>
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Restart Button */}
        <Button
          onClick={handleRestart}
          variant="ghost"
          className="w-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl font-bold py-6 transition-all"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Start Session Over
        </Button>
      </div>
    </div>
  );
}