import { useState } from "react";
import { Calculator, Atom, BookOpen, Scroll, Leaf, Beaker, Search, Filter } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Input } from "@/components/student/ui/input";
import { Badge } from "@/components/student/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/student/ui/tabs";
import { QuizList } from "@/components/student/modules/QuizList";

export function QuizSelectionPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="min-h-screen pb-24" style={{ background: '#FAFBFF' }}>
      {/* Header */}
      <div 
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} 
        className="text-white p-6 rounded-b-3xl shadow-lg mb-6 relative"
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-3xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
        </div>
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Available Quizzes</h1>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
            <Input
              placeholder="Search quizzes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
            />
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4">
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Quizzes</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <QuizList />
          </TabsContent>

          <TabsContent value="pending">
            <QuizList />
          </TabsContent>

          <TabsContent value="completed">
            <div className="text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No completed quizzes yet</h3>
              <p className="text-gray-500">Start taking quizzes to see your results here</p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}