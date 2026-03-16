import React, { useState, useLayoutEffect, useRef } from "react";

console.log('StudentProgress.tsx is being loaded by the browser...');

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Star,
  Target,
  Award,
  Calendar,
  BookOpen,
  Clock,
  CheckCircle,
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Badge } from "@/components/student/ui/badge";
import { Progress } from "@/components/student/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/student/ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  performanceData,
  subjectPerformance,
  skillsData,
  quizTrends,
  attendanceData,
} from "@/data/studentMockData";

/**
 * Custom hook to get parent dimensions for Recharts
 * Bypasses ResponsiveContainer sizing issues in Tabs/Flexbox
 */
function useChartDimensions() {
  const ref = React.useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 350 });

  React.useLayoutEffect(() => {
    if (!ref.current) return;

    const measure = () => {
      const { width, height } = ref.current?.getBoundingClientRect() || { width: 0, height: 0 };
      if (width > 0) {
        console.log('Chart measure success:', width, height);
        setDimensions({ width, height: height || 350 });
      } else {
        // Fallback for hidden tabs
        const parentWidth = ref.current?.parentElement?.offsetWidth || 0;
        if (parentWidth > 0) {
          console.log('Chart fallback width:', parentWidth);
          setDimensions({ width: parentWidth, height: 350 });
        }
      }
    };

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(ref.current);
    
    measure();

    // Extra trigger for tabs
    const timer = setTimeout(measure, 1000);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, []);

  return [ref, dimensions] as const;
}

const iconMap: Record<string, any> = {
  calculator: BookOpen,
  atom: BookOpen,
  "book-open": BookOpen,
  scroll: BookOpen,
  leaf: BookOpen,
  beaker: BookOpen,
};

export function ProgressPage() {
  const [selectedSubject, setSelectedSubject] = React.useState<string | null>(null);
  const [trendRef, trendDims] = useChartDimensions();
  const [quizRef, quizDims] = useChartDimensions();
  const [skillsRef, skillsDims] = useChartDimensions();

  const fallbackWidth = typeof window !== 'undefined' ? Math.min(window.innerWidth - 300, 1200) : 800;

  const currentAverage = performanceData[performanceData.length - 1].score;
  const previousAverage = performanceData[performanceData.length - 2].score;
  const improvement = currentAverage - previousAverage;

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div 
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} 
        className="text-white p-6 md:p-10 rounded-b-[2rem] md:rounded-b-[3rem] shadow-xl relative overflow-hidden mb-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="max-w-screen-xl mx-auto relative z-10">
          <h1 className="text-2xl md:text-3xl font-extrabold mb-6 tracking-tight">Progress Insights</h1>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-white/15 backdrop-blur-md border border-white/20 shadow-xl">
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Current Average</p>
              <p className="text-2xl md:text-3xl font-bold">{currentAverage}%</p>
              <div className="flex items-center gap-1 mt-1 font-medium">
                <TrendingUp className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">+{improvement}% this month</span>
              </div>
            </Card>

            <Card className="p-4 bg-white/15 backdrop-blur-md border border-white/20 shadow-xl">
              <p className="text-xs text-white/70 font-medium uppercase tracking-wider mb-1">Attendance</p>
              <p className="text-2xl md:text-3xl font-bold">{attendanceData.percentage}%</p>
              <div className="flex items-center gap-1 mt-1 font-medium">
                <CheckCircle className="w-4 h-4 text-blue-200" />
                <span className="text-xs text-blue-200">{attendanceData.present} days present</span>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="flex w-full overflow-x-auto scrollbar-hide bg-gray-100/50 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="flex-1 min-w-[80px] rounded-xl">Overview</TabsTrigger>
            <TabsTrigger value="subjects" className="flex-1 min-w-[80px] rounded-xl">Subjects</TabsTrigger>
            <TabsTrigger value="skills" className="flex-1 min-w-[80px] rounded-xl">Skills</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Performance Trend */}
            <Card className="p-5 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Performance Trend</h3>
              <div className="h-[300px] md:h-[350px] w-full" ref={trendRef}>
                <LineChart 
                  width={trendDims.width || fallbackWidth} 
                  height={trendDims.height} 
                  data={performanceData} 
                  margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF5" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#7A869A', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 100]} 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#7A869A', fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#1F6FEB"
                    strokeWidth={4}
                    dot={{ fill: "#1F6FEB", r: 6, strokeWidth: 2, stroke: "#fff" }}
                    activeDot={{ r: 8, strokeWidth: 0 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </div>
            </Card>

            {/* Quiz Performance */}
            <Card className="p-5 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quiz Performance</h3>
              <div className="h-[300px] md:h-[350px] w-full" ref={quizRef}>
                <BarChart 
                  width={quizDims.width || fallbackWidth} 
                  height={quizDims.height} 
                  data={quizTrends} 
                  margin={{ top: 10, right: 30, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6ECF5" />
                  <XAxis 
                    dataKey="week" 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#7A869A', fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false}
                    tick={{ fill: '#7A869A', fontSize: 12 }}
                  />
                  <Tooltip 
                     contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '20px' }}
                  />
                  <Bar 
                    dataKey="average" 
                    fill="#1F6FEB" 
                    name="Average Score (%)" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                  <Bar 
                    dataKey="completion" 
                    fill="#0A2540" 
                    name="Completion Rate (%)" 
                    radius={[4, 4, 0, 0]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </div>
            </Card>

            {/* Improvement Suggestions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Personalized Suggestions</h3>
              <div className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg"
                >
                  <div className="bg-blue-500 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-900">Focus on Biology</p>
                    <p className="text-sm text-blue-700">
                      Your Biology scores have decreased. Try reviewing Cell Biology concepts.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-start gap-3 p-4 bg-green-50 rounded-lg"
                >
                  <div className="bg-green-500 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-900">Excellent Math Progress!</p>
                    <p className="text-sm text-green-700">
                      You've improved significantly in Mathematics. Keep practicing advanced topics.
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg"
                >
                  <div className="bg-purple-500 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-purple-900">Time Management Tip</p>
                    <p className="text-sm text-purple-700">
                      You're completing quizzes faster. Great job on improving efficiency!
                    </p>
                  </div>
                </motion.div>
              </div>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects" className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subjectPerformance.map((subject, index) => {
                const Icon = iconMap[subject.icon];
                const TrendIcon =
                  subject.trend === "up"
                    ? TrendingUp
                    : subject.trend === "down"
                      ? TrendingDown
                      : Minus;

                return (
                  <motion.div
                    key={subject.subject}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card
                      className="p-5 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => setSelectedSubject(subject.subject)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`${subject.color} text-white border-none`}>
                          {subject.subject}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-gray-900">{subject.subject}</h3>
                        <div
                          className={`flex items-center gap-1 ${subject.trend === "up"
                            ? "text-green-600"
                            : subject.trend === "down"
                              ? "text-red-600"
                              : "text-gray-600"
                            }`}
                        >
                          <TrendIcon className="w-4 h-4" />
                          <span className="text-sm font-semibold">{subject.score}%</span>
                        </div>
                      </div>

                      {/* Mini chart */}
                      <div className="h-20 w-full overflow-hidden">
                        <LineChart width={250} height={80} data={subject.data.map((score, i) => ({ score, index: i }))}>
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke={subject.color === "bg-blue-500" ? "#1F6FEB" : "#0A2540"}
                            strokeWidth={3}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          {/* Skills Tab */}
          <TabsContent value="skills" className="space-y-6">
            <Card className="p-5 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Skills Assessment</h3>
              <div className="h-[300px] md:h-[450px] min-h-[350px]" ref={skillsRef}>
                <RadarChart 
                  width={skillsDims.width || fallbackWidth} 
                  height={skillsDims.height} 
                  data={skillsData} 
                  outerRadius="80%"
                >
                  <PolarGrid stroke="#E6ECF5" />
                  <PolarAngleAxis dataKey="skill" tick={{ fill: '#7A869A', fontSize: 12 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} axisLine={false} tick={false} />
                  <Radar
                    name="Current Proficiency"
                    dataKey="current"
                    stroke="#1F6FEB"
                    fill="#1F6FEB"
                    fillOpacity={0.5}
                    isAnimationActive={false}
                  />
                  <Legend />
                  <Tooltip 
                     contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' 
                    }}
                  />
                </RadarChart>
              </div>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {skillsData.map((skill, index) => {
                const isAboveExpected = skill.current >= skill.expected;
                const difference = Math.abs(skill.current - skill.expected);

                return (
                  <motion.div
                    key={skill.skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>{skill.skill}</span>
                        <span className="text-sm font-bold" style={{ color: '#1F6FEB' }}>{skill.current}%</span>
                      </div>
                      <Badge
                        variant={isAboveExpected ? "default" : "secondary"}
                        className={isAboveExpected ? "bg-green-500" : ""}
                      >
                        {isAboveExpected ? "Strong" : "Growing"}
                      </Badge>
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Current</span>
                            <span className="font-semibold">{skill.current}%</span>
                          </div>
                          <Progress value={skill.current} className="h-2" />
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}