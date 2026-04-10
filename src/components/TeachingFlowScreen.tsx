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
} from 'lucide-react';
import { generateTopicSpecificContent } from '../utils/aiTeachingContent';
import { pdfService } from '../utils/pdfService';

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
  if (!lesson) {
    return <div>No lesson selected</div>;
  }

  // Use the persisted AI Plan if available, otherwise generate generic content
  const aiContent = lesson.aiPlan || generateTopicSpecificContent(
    lesson.topic,
    lesson.subject,
    lesson.class
  );

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