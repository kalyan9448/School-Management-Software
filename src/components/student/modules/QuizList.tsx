import { Clock, CheckCircle2, BookOpen, PenTool, Flag, Calculator, Atom, Scroll } from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { useNavigate } from "react-router";
import { HomeworkService } from "@/services/student/studentDataService";

const iconMap: Record<string, any> = {
  calculator: Calculator,
  atom: Atom,
  "book-open": BookOpen,
  scroll: Scroll,
  leaf: BookOpen,
  beaker: Atom,
};

interface Quiz {
  id: number;
  title: string;
  subject: string;
  icon: string;
  dueDate: string;
  estimatedTime: string;
  priority: "high" | "medium" | "low";
  color: string;
  questions: number;
}

const availableQuizzes: Quiz[] = [
  {
    id: 1,
    title: "Algebra Practice Quiz",
    subject: "Mathematics",
    icon: "calculator",
    dueDate: "Today",
    estimatedTime: "15 min",
    priority: "high",
    color: "bg-blue-500",
    questions: 8,
  },
  {
    id: 2,
    title: "Physics Chapter 3 Test",
    subject: "Physics",
    icon: "atom",
    dueDate: "Today",
    estimatedTime: "20 min",
    priority: "high",
    color: "bg-purple-500",
    questions: 10,
  },
  {
    id: 3,
    title: "English Literature Quiz",
    subject: "English",
    icon: "book-open",
    dueDate: "Tomorrow",
    estimatedTime: "12 min",
    priority: "medium",
    color: "bg-green-500",
    questions: 6,
  },
  {
    id: 4,
    title: "World History Review",
    subject: "History",
    icon: "scroll",
    dueDate: "In 2 days",
    estimatedTime: "18 min",
    priority: "medium",
    color: "bg-amber-500",
    questions: 9,
  },
  {
    id: 5,
    title: "Cell Biology Test",
    subject: "Biology",
    icon: "leaf",
    dueDate: "In 3 days",
    estimatedTime: "15 min",
    priority: "low",
    color: "bg-emerald-500",
    questions: 8,
  },
  {
    id: 6,
    title: "Chemical Reactions Quiz",
    subject: "Chemistry",
    icon: "beaker",
    dueDate: "Next week",
    estimatedTime: "14 min",
    priority: "low",
    color: "bg-red-500",
    questions: 7,
  },
];

export function QuizList() {
  const navigate = useNavigate();
  const availableQuizzes = HomeworkService.getRecommendedQuizzes();

  return (
    <div className="space-y-4">
      {availableQuizzes.map((quiz) => {
        const Icon = iconMap[quiz.icon] || BookOpen;
        return (
          <Card key={quiz.id} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              <div className={`${quiz.color} p-3 rounded-xl`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{quiz.title}</h3>
                  {quiz.priority === "high" && (
                    <Badge variant="destructive" className="text-xs">
                      High Priority
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{quiz.subject}</p>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {quiz.estimatedTime}
                  </span>
                  <span>{quiz.questions} questions</span>
                  <span className="flex items-center gap-1">
                    <Flag className="w-3 h-3" />
                    {quiz.dueDate}
                  </span>
                </div>
              </div>
              <Button size="sm" onClick={() => navigate(`/student/homework/${quiz.id}`)}>
                Start
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}