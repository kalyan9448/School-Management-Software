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
} from 'lucide-react';
import { generateTopicSpecificContent } from '../utils/aiTeachingContent';

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

  // Generate AI topic-specific content
  const aiContent = generateTopicSpecificContent(
    lesson.topic,
    lesson.subject,
    lesson.class
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1">🎓 AI-Powered Teaching Guide</h2>
          <p className="text-gray-600">
            Topic-specific recommendations based on class pedagogy and student performance data
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Back to Lessons
        </button>
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
            {aiContent.keyDefinitions.map((def, index) => (
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
            {aiContent.formulas.map((formula, index) => (
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
      {aiContent.realWorldExamples.length > 0 && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
          <h3 className="font-semibold text-gray-900 mb-4">🌍 Real-World Applications</h3>
          <div className="space-y-3">
            {aiContent.realWorldExamples.map((example, index) => (
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

      {/* Pedagogy Adjustment Suggestions */}
      {aiContent.pedagogyAdjustments.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Pedagogy Adjustment Suggestions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {aiContent.pedagogyAdjustments.map((adjustment, index) => (
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