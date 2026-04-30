import React from 'react';
import {
  Brain,
  Clock,
  CheckCircle,
  Target,
  Sparkles,
  AlertCircle,
  Users,
  ChevronRight,
  BookOpen,
  Download,
  MessageSquare,
  Send,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { generateTopicSpecificContent } from '../utils/aiTeachingContent';
import { pdfService } from '../utils/pdfService';
import { aiService } from '../services/aiService';
import { useAIFeatureEnabled } from '../hooks/useAIFeatureEnabled';
import { TeacherEvaluationQuestion, TeacherEvaluationResult } from '../types';

interface TeachingFlowScreenProps {
  lesson: any;
  onBack: () => void;
  onMarkAttendance: () => void;
}

export function TeachingFlowScreen({
  lesson,
  onBack,
  onMarkAttendance,
}: TeachingFlowScreenProps) {
  const { isEnabled: isAIEnabled, isLoading: isAILoading, getDisabledMessage } = useAIFeatureEnabled();
  const [evaluationQuestions, setEvaluationQuestions] = React.useState<TeacherEvaluationQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState(0);
  const [teacherAnswer, setTeacherAnswer] = React.useState('');
  const [evaluationResult, setEvaluationResult] = React.useState<TeacherEvaluationResult | null>(null);
  const [evaluationResults, setEvaluationResults] = React.useState<TeacherEvaluationResult[]>([]);
  const [isEvaluationComplete, setIsEvaluationComplete] = React.useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = React.useState(false);
  const [isEvaluating, setIsEvaluating] = React.useState(false);

  if (!lesson) {
    return <div>No lesson selected</div>;
  }

  // Use the persisted AI Plan if available, otherwise generate generic content
  const aiContent = lesson.aiPlan || generateTopicSpecificContent(
    lesson.topic,
    lesson.subject,
    lesson.class
  );

  React.useEffect(() => {
    async function fetchQuestions() {
      if (isAILoading) {
        return; // Wait for AI check to complete
      }

      if (!isAIEnabled) {
        return;
      }
      
      setIsLoadingQuestions(true);
      try {
        const questions = await aiService.generateTeacherKnowledgeQuestions(lesson.subject, lesson.topic);
        setEvaluationQuestions(questions);
      } catch (error) {
        console.error('Error fetching evaluation questions:', error);
      } finally {
        setIsLoadingQuestions(false);
      }
    }
    fetchQuestions();
  }, [lesson.topic, lesson.subject, isAIEnabled, isAILoading]);

  const handleEvaluate = async () => {
    if (!isAIEnabled) {
      alert(getDisabledMessage());
      return;
    }

    if (!teacherAnswer.trim()) return;
    setIsEvaluating(true);
    try {
      const result = await aiService.evaluateTeacherResponse(
        evaluationQuestions[currentQuestionIndex].question,
        teacherAnswer,
        lesson.topic
      );
      setEvaluationResult(result);
      setEvaluationResults(prev => [...prev, result]);
    } catch (error) {
      console.error('Error evaluating response:', error);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setTeacherAnswer('');
    setEvaluationResult(null);
    if (currentQuestionIndex < evaluationQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsEvaluationComplete(true);
    }
  };

  const restartEvaluation = () => {
    setCurrentQuestionIndex(0);
    setTeacherAnswer('');
    setEvaluationResult(null);
    setEvaluationResults([]);
    setIsEvaluationComplete(false);
  };

  const isPersistedPlan = !!lesson.aiPlan;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">🎓 AI-Powered Teaching Guide</h2>
          <p className="text-gray-600">
            {isPersistedPlan 
              ? `Real-time pedagogical strategy for ${lesson.class} | Adjusted for class performance`
              : 'Topic-specific recommendations based on class pedagogy and student performance data'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => pdfService.generateLessonPlanPDF(lesson)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Back to Lessons
          </button>
        </div>
      </div>

      {/* Lesson Overview */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-purple-200 text-sm mb-1">Class</p>
            <p className="font-semibold">
              {lesson.class} - Section {lesson.section}
            </p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Subject</p>
            <p className="font-semibold">{lesson.subject}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Topic</p>
            <p className="font-semibold">{lesson.topic}</p>
          </div>
          <div>
            <p className="text-purple-200 text-sm mb-1">Date</p>
            <p className="font-semibold">
              {new Date(lesson.date).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Topic Explanation for Teacher Reference */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Topic Explanation - Teacher Reference</h3>
            <p className="text-sm text-gray-600">Detailed background for effective teaching</p>
          </div>
        </div>
        <p className="text-gray-700 leading-relaxed">{aiContent.topicExplanation}</p>
      </div>

      {/* Key Definitions */}
      {aiContent.keyDefinitions.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-600" />
            Key Definitions & Concepts
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiContent.keyDefinitions.map((def: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-purple-50 rounded-lg border border-purple-200"
              >
                <h4 className="font-semibold text-purple-900 mb-2">{def.term}</h4>
                <p className="text-sm text-gray-700">{def.definition}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Formulas & Key Principles */}
      {aiContent.formulas.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Key Formulas & Principles
          </h3>
          <div className="space-y-4">
            {aiContent.formulas.map((formula: any, index: number) => (
              <div
                key={index}
                className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-l-4 border-blue-500"
              >
                <h4 className="font-semibold text-gray-900 mb-2">{formula.name}</h4>
                <div className="bg-white p-3 rounded mb-2 font-mono text-lg text-center border border-blue-200">
                  {formula.formula}
                </div>
                <p className="text-sm text-gray-600 italic">{formula.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Real-World Applications */}
      {aiContent.realWorldExamples && aiContent.realWorldExamples.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🌍 Real-World Applications</h3>
          <div className="space-y-3">
            {aiContent.realWorldExamples.map((example: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-200"
              >
                <div className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold mt-0.5">
                  {index + 1}
                </div>
                <p className="text-gray-700">{example}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step-by-Step Micro-Learning Plan */}
      {aiContent.stepByStepPlan && aiContent.stepByStepPlan.length > 0 && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-purple-100">
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-6 border-b border-purple-100">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              Micro-Learning Execution Steps
            </h3>
            <p className="text-xs text-purple-700 font-medium">Step-by-step methodology for this specific topic</p>
          </div>
          <div className="divide-y divide-gray-100">
            {aiContent.stepByStepPlan.map((step: any, index: number) => (
              <div key={index} className="p-6 flex gap-4 hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">{step.step}</h4>
                  <p className="text-gray-700 text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teaching Methodology */}
      {aiContent.teachingMethodology && (
        <div className="bg-gray-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Brain className="w-32 h-32" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                <Brain className="w-7 h-7 text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Recommended Teaching Methodology</h3>
                <p className="text-purple-300 text-sm">Pedagogical approach customized for this session</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-[10px]">
                  <Target className="w-4 h-4" /> Approach
                </div>
                <p className="text-lg text-gray-200 leading-relaxed font-medium">
                  {aiContent.teachingMethodology.approach}
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-widest text-[10px]">
                  <Sparkles className="w-4 h-4" /> Activity Idea
                </div>
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <p className="text-gray-300 italic">
                    "{aiContent.teachingMethodology.activity}"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pedagogy Adjustment Suggestions */}
      {aiContent.pedagogyAdjustments && aiContent.pedagogyAdjustments.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Pedagogy Adjustment Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiContent.pedagogyAdjustments.map((adjustment: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-2 bg-white p-4 rounded-lg border border-orange-200"
              >
                <Sparkles className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-700">{adjustment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Objectives */}
      {lesson.objectives && lesson.objectives.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">📋 Learning Objectives (Logged)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lesson.objectives.map((objective: string, index: number) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-purple-50 rounded-lg border border-purple-200"
              >
                <CheckCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <span className="text-sm text-gray-700">{objective}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Students Needing Attention */}
      {lesson.studentsNeedingAttention && lesson.studentsNeedingAttention.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            Students Needing Extra Attention
          </h3>
          <div className="flex flex-wrap gap-2">
            {lesson.studentsNeedingAttention.map((student: string, index: number) => (
              <span
                key={index}
                className="px-3 py-2 bg-red-100 border border-red-300 rounded-full text-sm font-medium text-red-900"
              >
                {student}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Teacher Knowledge Evaluation Section */}
      <div className="bg-white rounded-2xl shadow-xl border-t-4 border-purple-500 overflow-hidden">
        <div className="bg-purple-50 p-6 border-b border-purple-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Knowledge Depth Verification</h3>
              <p className="text-sm text-purple-700">Test your depth before the session</p>
            </div>
          </div>
          {isLoadingQuestions && isAIEnabled && <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />}
        </div>

        <div className="p-8">
          {!isAIEnabled ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-700 mb-2">AI Features Disabled</h4>
              <p className="text-gray-500 max-w-md mx-auto">{getDisabledMessage()}</p>
            </div>
          ) : isEvaluationComplete ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-8 text-white text-center shadow-xl">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-2xl font-bold mb-2">Verification Complete!</h4>
                <p className="text-purple-100 mb-6">You've successfully analyzed {evaluationQuestions.length} key pedagogical dimensions for this topic.</p>
                
                <div className="grid grid-cols-2 gap-4 text-left">
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                    <span className="text-xs uppercase tracking-wider text-purple-200">Overall Mastery</span>
                    <p className="text-lg font-bold">
                      {evaluationResults.every(r => r.understandingLevel === 'Expert') ? 'Expert' : 
                       evaluationResults.some(r => r.understandingLevel === 'Expert' || r.understandingLevel === 'Proficient') ? 'Proficient' : 'Novice'}
                    </p>
                  </div>
                  <div className="bg-white/10 p-4 rounded-xl backdrop-blur-md">
                    <span className="text-xs uppercase tracking-wider text-purple-200">Insight Depth</span>
                    <p className="text-lg font-bold">Comprehensive</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                <h5 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Final Mentor Summary
                </h5>
                <p className="text-gray-700 leading-relaxed italic border-l-4 border-purple-200 pl-4">
                  "Your responses indicate a solid grasp of both the conceptual and practical challenges of teaching {lesson.topic}. 
                  You are well-prepared to guide students through the complexities they may face today."
                </p>
              </div>

              <button
                onClick={restartEvaluation}
                className="w-full py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Review & Redo Verification
              </button>
            </div>
          ) : evaluationQuestions.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 relative">
                <div className="absolute top-0 right-0 -mt-3 mr-4 bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {evaluationQuestions.length}
                </div>
                <h4 className="text-lg font-medium text-gray-900 leading-relaxed italic">
                  "{evaluationQuestions[currentQuestionIndex].question}"
                </h4>
              </div>

              {!evaluationResult ? (
                <div className="space-y-4">
                  <textarea
                    value={teacherAnswer}
                    onChange={(e) => setTeacherAnswer(e.target.value)}
                    placeholder="Briefly explain your pedagogical approach to this question..."
                    className="w-full h-32 p-4 bg-white border-2 border-purple-100 rounded-xl focus:border-purple-500 focus:ring-0 transition-all text-gray-700 placeholder:text-gray-400"
                  />
                  <button
                    onClick={handleEvaluate}
                    disabled={isEvaluating || !teacherAnswer.trim()}
                    className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md"
                  >
                    {isEvaluating ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Verify My Depth
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className={`p-6 rounded-xl border-2 ${evaluationResult.isSufficient ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {evaluationResult.isSufficient ? (
                          <CheckCircle className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertCircle className="w-6 h-6 text-orange-600" />
                        )}
                        <h4 className="font-bold text-gray-900">AI Feedback</h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Level:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          evaluationResult.understandingLevel === 'Expert' ? 'bg-green-600 text-white' : 
                          evaluationResult.understandingLevel === 'Proficient' ? 'bg-blue-600 text-white' : 
                          'bg-orange-500 text-white'
                        }`}>
                          {evaluationResult.understandingLevel}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-800 leading-relaxed mb-4">{evaluationResult.feedback}</p>
                    
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500">How to improve:</h5>
                      {evaluationResult.suggestions.map((s, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                          <ChevronRight className="w-4 h-4 text-purple-500 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </div>
                      ))}
                    </div>

                    {!evaluationResult.isSufficient && (
                      <div className="mt-6 p-4 bg-white border border-orange-200 rounded-lg">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">💡 Suggested Strategy Revision:</h5>
                        <p className="text-sm text-gray-700 italic">"{evaluationResult.promptRevision}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleReset}
                      className="w-full py-4 bg-purple-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition-all shadow-md"
                    >
                      <RefreshCw className="w-5 h-5" />
                      {currentQuestionIndex < evaluationQuestions.length - 1 ? 'Attempt Next Question' : 'View Final Mastery Summary'}
                    </button>
                    
                    {currentQuestionIndex < evaluationQuestions.length - 1 && (
                      <p className="text-center text-xs text-gray-500 italic">
                        Highly recommended to complete all {evaluationQuestions.length} verification questions.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              {isLoadingQuestions ? 'Generating deep questions for you...' : 'No evaluation questions available for this topic.'}
            </div>
          )}
        </div>
      </div>

      {/* Mark Attendance Button */}
      <div className="flex items-center justify-center pt-4">
        <button
          onClick={onMarkAttendance}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg flex items-center gap-3 text-lg font-semibold"
        >
          <Users className="w-6 h-6" />
          Mark Attendance for This Class
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}