// Mock data for student dashboard

// =============================================================
// Dynamic date helpers — defined at the TOP so they are
// initialized before any exported constant that calls them.
// (`const` is NOT hoisted like `function`, so order matters.)
// =============================================================

/** ISO date string (YYYY-MM-DD) offset by daysOffset from today */
const getRelativeDate = (daysOffset: number): string => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

/** ISO date string for specific weekday in a given week.
 *  day: 1=Mon … 5=Fri | weekOffset: 0=this week, 1=next, -1=last */
const getWeekDay = (day: number, weekOffset: number = 0): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDay = today.getDay() === 0 ? 7 : today.getDay(); // Sun→7
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay - 1) + weekOffset * 7);
  const target = new Date(monday);
  target.setDate(monday.getDate() + (day - 1));
  return target.toISOString().split('T')[0];
};

/** ISO timestamp string offset from today */
const getRelativeTimestamp = (daysOffset: number, hour = 8, minute = 0): string => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString();
};

export { getRelativeDate, getWeekDay, getRelativeTimestamp };

export const studentData = {
  name: "Alex Rivera",
  avatar: "AR",
  grade: "10th Grade",
};


export const motivationalQuotes = [
  "Every expert was once a beginner!",
  "Learning is a treasure that will follow its owner everywhere.",
  "The secret of getting ahead is getting started.",
  "Education is the passport to the future.",
  "Small progress is still progress!",
];

export const todaysClasses = [
  {
    id: 1,
    subject: "Mathematics",
    icon: "calculator",
    topics: ["Quadratic Equations", "Factoring"],
    teacher: "Mr. Johnson",
    time: "9:00 AM",
    color: "bg-blue-500",
    status: "completed",
    topicDetails: {
      mainTopic: "Quadratic Equations",
      description: "Understanding and solving quadratic equations is fundamental to algebra. This topic covers various methods to find solutions and understand the behavior of quadratic functions.",
      learningObjectives: [
        "Identify and write quadratic equations in standard form",
        "Solve quadratic equations using the quadratic formula",
        "Factor quadratic expressions and solve by factoring",
        "Understand the relationship between roots and the discriminant",
        "Apply quadratic equations to real-world problems"
      ],
      keyPoints: [
        "A quadratic equation has the form ax² + bx + c = 0",
        "The quadratic formula: x = (-b ± √(b² - 4ac)) / 2a",
        "The discriminant (b² - 4ac) determines the nature of roots",
        "Factoring is often the quickest method when possible",
        "Completing the square helps understand parabola properties"
      ],
      overview: "Quadratic equations are polynomial equations of degree 2. They appear frequently in physics, engineering, and real-world applications. In this lesson, we explore multiple solution methods including factoring, using the quadratic formula, and completing the square. Understanding the discriminant helps predict the number and type of solutions without solving the equation completely."
    }
  },
  {
    id: 2,
    subject: "Physics",
    icon: "atom",
    topics: ["Newton's Laws", "Force & Motion"],
    teacher: "Ms. Chen",
    time: "10:30 AM",
    color: "bg-purple-500",
    status: "completed",
    topicDetails: {
      mainTopic: "Newton's Laws of Motion",
      description: "Newton's three laws form the foundation of classical mechanics. These principles explain how objects move and interact with forces in our everyday world.",
      learningObjectives: [
        "State and explain Newton's three laws of motion",
        "Apply Newton's Second Law (F = ma) to solve problems",
        "Identify action-reaction force pairs",
        "Understand the concept of inertia and mass",
        "Analyze motion using free-body diagrams"
      ],
      keyPoints: [
        "First Law: Objects maintain constant velocity unless acted upon by a net force (Law of Inertia)",
        "Second Law: F = ma relates force, mass, and acceleration",
        "Third Law: For every action, there is an equal and opposite reaction",
        "Forces always come in pairs acting on different objects",
        "Mass is a measure of an object's inertia"
      ],
      overview: "Newton's Laws of Motion revolutionized our understanding of physics. The First Law introduces inertia, explaining why objects resist changes in motion. The Second Law provides a mathematical relationship between force, mass, and acceleration. The Third Law reveals that forces always occur in pairs. Together, these laws allow us to predict and explain motion from everyday activities to spacecraft trajectories."
    }
  },
  {
    id: 3,
    subject: "English",
    topic: "Shakespearean Sonnets Analysis",
    teacher: "Mr. Williams",
    icon: "book-open",
    color: "bg-green-500",
    status: "pending",
    topicDetails: {
      mainTopic: "Shakespeare's Sonnets",
      description: "Shakespeare's 154 sonnets are masterpieces of English poetry, exploring themes of love, beauty, time, and mortality through intricate wordplay and structure.",
      learningObjectives: [
        "Identify the structure and rhyme scheme of Shakespearean sonnets",
        "Analyze poetic devices including metaphor, imagery, and personification",
        "Interpret major themes in Shakespeare's sonnets",
        "Understand the historical and cultural context",
        "Compare and contrast different sonnets"
      ],
      keyPoints: [
        "Sonnets have 14 lines in iambic pentameter",
        "Rhyme scheme: ABAB CDCD EFEF GG",
        "Structure: 3 quatrains and a closing couplet",
        "Common themes: love, beauty, time, mortality, art",
        "The 'turn' or volta often occurs in the final couplet"
      ],
      overview: "Shakespeare's sonnets represent the pinnacle of English poetry. Written primarily in the 1590s, these 14-line poems follow a specific structure and explore universal human experiences. The Shakespearean sonnet form uses three quatrains to develop an idea and a closing couplet to provide resolution or commentary. Rich in metaphor and wordplay, these poems remain relevant today for their profound insights into human nature."
    }
  },
];

export const pendingTasks = [
  {
    id: 1,
    title: "Algebra Practice Quiz",
    subject: "Mathematics",
    icon: "calculator",
    dueDate: "Today",
    estimatedTime: "15 min",
    priority: "high",
    color: "bg-blue-500",
    type: "homework",
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
    type: "quiz",
  },
  {
    id: 3,
    title: "History Assignment",
    subject: "History",
    icon: "scroll",
    dueDate: "Tomorrow",
    estimatedTime: "10 min",
    priority: "medium",
    color: "bg-amber-500",
    type: "assignment",
  },
  {
    id: 4,
    title: "Biology Review",
    subject: "Biology",
    icon: "leaf",
    dueDate: "In 3 days",
    estimatedTime: "12 min",
    priority: "low",
    color: "bg-emerald-500",
    type: "study",
  },
];

export const learningGoals = [
  {
    subject: "Mathematics",
    goal: "Complete 3 quizzes",
    current: 2,
    target: 3,
    icon: "calculator",
    color: "bg-blue-500",
  },
  {
    subject: "Physics",
    goal: "Watch 2 videos",
    current: 2,
    target: 2,
    icon: "atom",
    color: "bg-purple-500",
  },
  {
    subject: "English",
    goal: "Read 1 chapter",
    current: 0,
    target: 1,
    icon: "book-open",
    color: "bg-green-500",
  },
];


export const quizQuestions = [
  {
    id: 1,
    question: "What is the quadratic formula?",
    type: "mcq",
    difficulty: "medium",
    options: [
      "x = (-b ± √(b² - 4ac)) / 2a",
      "x = -b / 2a",
      "x = b² - 4ac",
      "x = a² + b² = c²",
    ],
    correctAnswer: 0,
    explanation:
      "The quadratic formula is used to solve quadratic equations of the form ax² + bx + c = 0.",
  },
  {
    id: 2,
    question: "What is Newton's First Law of Motion?",
    type: "mcq",
    difficulty: "easy",
    options: [
      "An object at rest stays at rest unless acted upon by a force",
      "F = ma",
      "For every action there is an equal and opposite reaction",
      "Energy cannot be created or destroyed",
    ],
    correctAnswer: 0,
    explanation:
      "Newton's First Law, also known as the law of inertia, states that an object will remain at rest or in uniform motion unless acted upon by an external force.",
  },
  {
    id: 3,
    question: "The Earth revolves around the Sun.",
    type: "true-false",
    difficulty: "easy",
    correctAnswer: true,
    explanation: "The Earth orbits (revolves) around the Sun once every 365.25 days.",
  },
  {
    id: 4,
    question: "What is the capital of France?",
    type: "mcq",
    difficulty: "easy",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: 2,
    explanation: "Paris has been the capital of France for centuries.",
  },
  {
    id: 5,
    question: "What is the chemical symbol for water?",
    type: "fill-blank",
    difficulty: "easy",
    correctAnswer: "H2O",
    explanation: "Water is composed of two hydrogen atoms and one oxygen atom.",
  },
  {
    id: 6,
    question: "Solve: 2x + 5 = 15. What is x?",
    type: "mcq",
    difficulty: "medium",
    options: ["5", "10", "7.5", "20"],
    correctAnswer: 0,
    explanation: "Subtract 5 from both sides: 2x = 10, then divide by 2: x = 5.",
  },
  {
    id: 7,
    question: "Photosynthesis occurs in animal cells.",
    type: "true-false",
    difficulty: "easy",
    correctAnswer: false,
    explanation: "Photosynthesis occurs in plant cells, not animal cells.",
  },
  {
    id: 8,
    question: "What year did World War II end?",
    type: "mcq",
    difficulty: "medium",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: 2,
    explanation: "World War II ended in 1945 with the surrender of Japan in September.",
  },
];

export const timelineEvents = [
  {
    id: 1,
    type: "class",
    date: getRelativeDate(0),
    time: "9:00 AM",
    subject: "Mathematics",
    topicId: 1,
    icon: "calculator",
    color: "bg-blue-500",
    title: "Algebra Class",
    topics: ["Quadratic Equations", "Factoring"],
    teacher: "Mr. Johnson",
    objectives: ["Understand factoring", "Solve equations"],
  },
  {
    id: 2,
    type: "quiz",
    date: getRelativeDate(0),
    time: "10:45 AM",
    subject: "Physics",
    topicId: 2,
    icon: "atom",
    color: "bg-purple-500",
    title: "Newton's Laws Quiz",
    score: 85,
    totalQuestions: 10,
    correctAnswers: 9,
    timeSpent: "12 min",
  },
  {
    id: 4,
    type: "note",
    date: getRelativeDate(-1),
    time: "2:15 PM",
    teacher: "Ms. Chen",
    teacherAvatar: "MC",
    subject: "Physics",
    category: "positive",
    note: "Excellent participation in today's lab experiment! Keep up the great work.",
  },
  {
    id: 5,
    type: "class",
    date: getRelativeDate(-1),
    time: "1:00 PM",
    subject: "English",
    topicId: 3,
    icon: "book-open",
    color: "bg-green-500",
    title: "Literature Discussion",
    topics: ["Shakespeare's Sonnets"],
    teacher: "Mrs. Davis",
    objectives: ["Analyze poetic devices", "Interpret themes"],
  },
  {
    id: 6,
    type: "attendance",
    date: getRelativeDate(-1),
    time: "8:00 AM",
    status: "present",
    checkIn: "8:05 AM",
    checkOut: "3:30 PM",
  },
  {
    id: 7,
    type: "quiz",
    date: getRelativeDate(-2),
    time: "11:30 AM",
    subject: "History",
    topicId: 2, // Dummy for now since history topic isn't in homeworkTopics
    icon: "scroll",
    color: "bg-amber-500",
    title: "World War II Quiz",
    score: 95,
    totalQuestions: 10,
    correctAnswers: 10,
    timeSpent: "8 min",
  },
];


export const performanceData = [
  { month: "Sep", score: 75 },
  { month: "Oct", score: 78 },
  { month: "Nov", score: 82 },
  { month: "Dec", score: 80 },
  { month: "Jan", score: 85 },
  { month: "Feb", score: 88 },
];

export const subjectPerformance = [
  {
    subject: "Mathematics",
    score: 88,
    trend: "up",
    stars: 5,
    color: "bg-blue-500",
    icon: "calculator",
    data: [75, 78, 82, 85, 88],
  },
  {
    subject: "Physics",
    score: 85,
    trend: "up",
    stars: 4,
    color: "bg-purple-500",
    icon: "atom",
    data: [70, 75, 80, 82, 85],
  },
  {
    subject: "English",
    score: 92,
    trend: "up",
    stars: 5,
    color: "bg-green-500",
    icon: "book-open",
    data: [85, 87, 88, 90, 92],
  },
  {
    subject: "History",
    score: 80,
    trend: "same",
    stars: 4,
    color: "bg-amber-500",
    icon: "scroll",
    data: [78, 80, 79, 81, 80],
  },
  {
    subject: "Biology",
    score: 78,
    trend: "down",
    stars: 3,
    color: "bg-emerald-500",
    icon: "leaf",
    data: [85, 82, 80, 79, 78],
  },
  {
    subject: "Chemistry",
    score: 83,
    trend: "up",
    stars: 4,
    color: "bg-red-500",
    icon: "beaker",
    data: [75, 78, 80, 82, 83],
  },
];

export const skillsData = [
  { skill: "Problem Solving", current: 85, expected: 80 },
  { skill: "Critical Thinking", current: 78, expected: 75 },
  { skill: "Creativity", current: 72, expected: 70 },
  { skill: "Communication", current: 88, expected: 75 },
  { skill: "Collaboration", current: 80, expected: 80 },
  { skill: "Time Management", current: 75, expected: 75 },
];

export const topicMastery = [
  { topic: "Quadratic Equations", subject: "Math", level: "Advanced", progress: 90 },
  { topic: "Newton's Laws", subject: "Physics", level: "Mastered", progress: 100 },
  { topic: "Shakespeare", subject: "English", level: "Intermediate", progress: 65 },
  { topic: "World War II", subject: "History", level: "Advanced", progress: 85 },
  { topic: "Cell Biology", subject: "Biology", level: "Beginner", progress: 40 },
  { topic: "Chemical Reactions", subject: "Chemistry", level: "Intermediate", progress: 70 },
];

export const quizTrends = [
  { week: "Week 1", average: 75, completion: 85 },
  { week: "Week 2", average: 78, completion: 90 },
  { week: "Week 3", average: 82, completion: 88 },
  { week: "Week 4", average: 85, completion: 95 },
];

export const attendanceData = {
  percentage: 94,
  present: 85,
  absent: 3,
  late: 2,
  total: 90,
};

export const dailyTasksBySubject = [
  {
    subject: "Mathematics",
    teacher: "Mr. Johnson",
    icon: "calculator",
    color: "bg-blue-500",
    tasks: [
      {
        id: 1,
        title: "Complete practice problems 1-15",
        description: "Focus on factoring quadratic equations",
        type: "homework",
        dueTime: "11:59 PM",
        completed: false,
        estimatedTime: "30 min",
      },
      {
        id: 2,
        title: "Watch video on completing the square",
        description: "Prepare for tomorrow's lesson",
        type: "video",
        dueTime: "Before class",
        completed: true,
        estimatedTime: "15 min",
      },
    ],
  },
  {
    subject: "Physics",
    teacher: "Ms. Chen",
    icon: "atom",
    color: "bg-purple-500",
    tasks: [
      {
        id: 3,
        title: "Lab report: Force and Motion experiment",
        description: "Include graphs and calculations",
        type: "assignment",
        dueTime: "11:59 PM",
        completed: false,
        estimatedTime: "45 min",
      },
      {
        id: 4,
        title: "Review Newton's Third Law",
        description: "Read textbook pages 78-82",
        type: "reading",
        dueTime: "Tomorrow",
        completed: false,
        estimatedTime: "20 min",
      },
    ],
  },
  {
    subject: "English",
    teacher: "Mrs. Davis",
    icon: "book-open",
    color: "bg-green-500",
    tasks: [
      {
        id: 5,
        title: "Analyze Sonnet 18",
        description: "Identify literary devices and themes",
        type: "assignment",
        dueTime: "11:59 PM",
        completed: false,
        estimatedTime: "25 min",
      },
      {
        id: 6,
        title: "Vocabulary quiz preparation",
        description: "Study words 1-20",
        type: "study",
        dueTime: "Before class",
        completed: true,
        estimatedTime: "15 min",
      },
    ],
  },
  {
    subject: "History",
    teacher: "Mr. Thompson",
    icon: "scroll",
    color: "bg-amber-500",
    tasks: [
      {
        id: 7,
        title: "Essay: Impact of World War II",
        description: "500-750 words, cite 3 sources",
        type: "essay",
        dueTime: "11:59 PM",
        completed: false,
        estimatedTime: "60 min",
      },
    ],
  },
  {
    subject: "Biology",
    teacher: "Dr. Martinez",
    icon: "leaf",
    color: "bg-emerald-500",
    tasks: [
      {
        id: 8,
        title: "Cell diagram labeling worksheet",
        description: "Label all cell organelles and their functions",
        type: "homework",
        dueTime: "Tomorrow",
        completed: true,
        estimatedTime: "20 min",
      },
      {
        id: 9,
        title: "Prepare for photosynthesis quiz",
        description: "Review notes and practice questions",
        type: "study",
        dueTime: "Friday",
        completed: false,
        estimatedTime: "30 min",
      },
    ],
  },
  {
    subject: "Chemistry",
    teacher: "Mr. Anderson",
    icon: "beaker",
    color: "bg-red-500",
    tasks: [
      {
        id: 10,
        title: "Balance chemical equations worksheet",
        description: "Complete problems 1-20",
        type: "homework",
        dueTime: "11:59 PM",
        completed: false,
        estimatedTime: "35 min",
      },
    ],
  },
];

// Flashcard data for each subject
export const flashcardsBySubject: Record<string, Array<{
  id: number;
  front: string;
  back: string;
  category: string;
}>> = {
  "Mathematics": [
    {
      id: 1,
      front: "What is a quadratic equation?",
      back: "A quadratic equation is a polynomial equation of degree 2, in the form ax² + bx + c = 0, where a ≠ 0.",
      category: "Definition",
    },
    {
      id: 2,
      front: "What is the quadratic formula?",
      back: "x = (-b ± √(b² - 4ac)) / 2a",
      category: "Formula",
    },
    {
      id: 3,
      front: "What is the discriminant?",
      back: "The discriminant is b² - 4ac. It determines the nature of the roots of a quadratic equation.",
      category: "Concept",
    },
    {
      id: 4,
      front: "When discriminant > 0, what type of roots?",
      back: "Two distinct real roots",
      category: "Property",
    },
    {
      id: 5,
      front: "When discriminant = 0, what type of roots?",
      back: "One repeated real root (two equal roots)",
      category: "Property",
    },
    {
      id: 6,
      front: "When discriminant < 0, what type of roots?",
      back: "Two complex (imaginary) roots",
      category: "Property",
    },
    {
      id: 7,
      front: "What is factoring?",
      back: "Factoring is expressing a quadratic as a product of two binomials: (px + q)(rx + s) = 0",
      category: "Method",
    },
    {
      id: 8,
      front: "Factor: x² + 5x + 6",
      back: "(x + 2)(x + 3)",
      category: "Example",
    },
    {
      id: 9,
      front: "What is the vertex form of a quadratic?",
      back: "y = a(x - h)² + k, where (h, k) is the vertex",
      category: "Form",
    },
    {
      id: 10,
      front: "How do you complete the square?",
      back: "Take half of the coefficient of x, square it, and add/subtract it to create a perfect square trinomial",
      category: "Method",
    },
  ],
  "Physics": [
    {
      id: 1,
      front: "State Newton's First Law",
      back: "An object at rest stays at rest, and an object in motion stays in motion with constant velocity unless acted upon by a net external force.",
      category: "Law",
    },
    {
      id: 2,
      front: "State Newton's Second Law",
      back: "The acceleration of an object is directly proportional to the net force acting on it and inversely proportional to its mass. F = ma",
      category: "Law",
    },
    {
      id: 3,
      front: "State Newton's Third Law",
      back: "For every action, there is an equal and opposite reaction.",
      category: "Law",
    },
    {
      id: 4,
      front: "What is inertia?",
      back: "Inertia is the tendency of an object to resist changes in its state of motion. Mass is a measure of inertia.",
      category: "Concept",
    },
    {
      id: 5,
      front: "If F = 20N and m = 5kg, what is a?",
      back: "a = F/m = 20/5 = 4 m/s²",
      category: "Calculation",
    },
    {
      id: 6,
      front: "Give an example of Newton's Third Law",
      back: "When you push against a wall, the wall pushes back with equal force. Rocket propulsion: gases expelled downward, rocket moves upward.",
      category: "Example",
    },
    {
      id: 7,
      front: "What is the SI unit of force?",
      back: "Newton (N), which equals kg⋅m/s²",
      category: "Unit",
    },
    {
      id: 8,
      front: "What happens if net force is zero?",
      back: "The object maintains constant velocity (no acceleration) - this is equilibrium",
      category: "Concept",
    },
  ],
  "English": [
    {
      id: 1,
      front: "How many lines are in a Shakespearean sonnet?",
      back: "14 lines",
      category: "Structure",
    },
    {
      id: 2,
      front: "What is the rhyme scheme of a Shakespearean sonnet?",
      back: "ABAB CDCD EFEF GG",
      category: "Structure",
    },
    {
      id: 3,
      front: "What are the three main sections of a sonnet?",
      back: "Three quatrains (4 lines each) and a closing couplet (2 lines)",
      category: "Structure",
    },
    {
      id: 4,
      front: "What is the purpose of the final couplet?",
      back: "The couplet typically provides a conclusion, summary, or twist to the themes presented in the quatrains.",
      category: "Purpose",
    },
    {
      id: 5,
      front: "What meter do sonnets use?",
      back: "Iambic pentameter (10 syllables per line, unstressed-stressed pattern)",
      category: "Meter",
    },
    {
      id: 6,
      front: "What is a volta?",
      back: "A turn or shift in thought, usually occurring at the ninth line or in the final couplet",
      category: "Term",
    },
    {
      id: 7,
      front: "Name a common theme in Shakespeare's sonnets",
      back: "Love, beauty, time, mortality, and the immortality of art",
      category: "Theme",
    },
    {
      id: 8,
      front: "What is iambic pentameter?",
      back: "A line of poetry with five iambs (unstressed-stressed syllable pairs), totaling 10 syllables",
      category: "Meter",
    },
  ],
};

// Homework Topics with AI-Generated Questions
export interface HomeworkTopic {
  id: number;
  subject: string;
  topic: string;
  teacher: string;
  icon: string;
  color: string;
  status: "pending" | "in-progress" | "completed";
  flashcardsCompleted: boolean;
  questionsCompleted: boolean;
  flashcardProgress: number; // percentage
  questionsProgress: number; // percentage
  accuracy: number | null; // percentage
  questionsAttempted: number;
  totalQuestions: number;
  lastAttemptDate: string | null;
  mistakePatterns: string[];
}

export const homeworkTopics: HomeworkTopic[] = [
  {
    id: 1,
    subject: "Mathematics",
    topic: "Quadratic Equations & Problem Solving",
    teacher: "Ms. Johnson",
    icon: "calculator",
    color: "bg-blue-500",
    status: "pending",
    flashcardsCompleted: false,
    questionsCompleted: false,
    flashcardProgress: 0,
    questionsProgress: 0,
    accuracy: null,
    questionsAttempted: 0,
    totalQuestions: 10,
    lastAttemptDate: null,
    mistakePatterns: [],
  },
  {
    id: 2,
    subject: "Physics",
    topic: "Newton's Laws of Motion",
    teacher: "Dr. Smith",
    icon: "atom",
    color: "bg-purple-500",
    status: "pending",
    flashcardsCompleted: false,
    questionsCompleted: false,
    flashcardProgress: 0,
    questionsProgress: 0,
    accuracy: null,
    questionsAttempted: 0,
    totalQuestions: 8,
    lastAttemptDate: null,
    mistakePatterns: [],
  },
  {
    id: 3,
    subject: "English",
    topic: "Shakespearean Sonnets Analysis",
    teacher: "Mr. Williams",
    icon: "book-open",
    color: "bg-green-500",
    status: "pending",
    flashcardsCompleted: false,
    questionsCompleted: false,
    flashcardProgress: 0,
    questionsProgress: 0,
    accuracy: null,
    questionsAttempted: 0,
    totalQuestions: 12,
    lastAttemptDate: null,
    mistakePatterns: [],
  },
];

// Objective Questions for each topic
export interface ObjectiveQuestion {
  id: number;
  topicId: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
  category: string;
  points: number;
}

export const objectiveQuestions: ObjectiveQuestion[] = [
  // Mathematics - Quadratic Equations
  {
    id: 1,
    topicId: 1,
    question: "What is the discriminant of the equation 2x² + 5x + 3 = 0?",
    options: ["1", "5", "7", "25"],
    correctAnswer: 0,
    explanation: "The discriminant is b² - 4ac = 5² - 4(2)(3) = 25 - 24 = 1",
    difficulty: "medium",
    category: "Calculation",
    points: 10,
  },
  {
    id: 2,
    topicId: 1,
    question: "If the discriminant is negative, what type of roots does the equation have?",
    options: ["Two real roots", "One real root", "No real roots (complex)", "Infinite roots"],
    correctAnswer: 2,
    explanation: "A negative discriminant indicates the equation has two complex (imaginary) roots.",
    difficulty: "easy",
    category: "Concept",
    points: 5,
  },
  {
    id: 3,
    topicId: 1,
    question: "Solve: x² - 5x + 6 = 0",
    options: ["x = 2, 3", "x = -2, -3", "x = 1, 6", "x = -1, -6"],
    correctAnswer: 0,
    explanation: "Factoring: (x-2)(x-3) = 0, so x = 2 or x = 3",
    difficulty: "easy",
    category: "Problem Solving",
    points: 10,
  },
  {
    id: 4,
    topicId: 1,
    question: "What is the vertex form of a quadratic equation?",
    options: ["y = ax² + bx + c", "y = a(x-h)² + k", "y = (x-a)(x-b)", "y = mx + b"],
    correctAnswer: 1,
    explanation: "The vertex form is y = a(x-h)² + k, where (h,k) is the vertex.",
    difficulty: "medium",
    category: "Forms",
    points: 10,
  },
  {
    id: 5,
    topicId: 1,
    question: "Using the quadratic formula, what is x when a=1, b=4, c=4?",
    options: ["x = -2", "x = 2", "x = 4", "x = -4"],
    correctAnswer: 0,
    explanation: "x = (-4 ± √(16-16))/2 = -4/2 = -2 (repeated root)",
    difficulty: "medium",
    category: "Application",
    points: 15,
  },
  {
    id: 6,
    topicId: 1,
    question: "What does 'completing the square' involve?",
    options: [
      "Adding the square of half the coefficient of x",
      "Multiplying both sides by a square",
      "Dividing by the coefficient of x²",
      "Taking the square root of both sides"
    ],
    correctAnswer: 0,
    explanation: "Completing the square involves adding (b/2)² to both sides to form a perfect square trinomial.",
    difficulty: "medium",
    category: "Method",
    points: 10,
  },
  {
    id: 7,
    topicId: 1,
    question: "If a parabola opens downward, what must be true?",
    options: ["a > 0", "a < 0", "a = 0", "b < 0"],
    correctAnswer: 1,
    explanation: "When a < 0, the parabola opens downward.",
    difficulty: "easy",
    category: "Graph",
    points: 5,
  },
  {
    id: 8,
    topicId: 1,
    question: "The sum of the roots of ax² + bx + c = 0 is:",
    options: ["-b/a", "b/a", "-c/a", "c/a"],
    correctAnswer: 0,
    explanation: "By Vieta's formulas, the sum of roots = -b/a",
    difficulty: "hard",
    category: "Theory",
    points: 15,
  },
  {
    id: 9,
    topicId: 1,
    question: "What is the axis of symmetry for y = 2x² - 8x + 5?",
    options: ["x = 2", "x = -2", "x = 4", "x = -4"],
    correctAnswer: 0,
    explanation: "Axis of symmetry: x = -b/(2a) = -(-8)/(2×2) = 8/4 = 2",
    difficulty: "medium",
    category: "Graph",
    points: 10,
  },
  {
    id: 10,
    topicId: 1,
    question: "A quadratic equation has roots 3 and -2. What is the equation?",
    options: [
      "x² - x - 6 = 0",
      "x² + x - 6 = 0",
      "x² - x + 6 = 0",
      "x² + x + 6 = 0"
    ],
    correctAnswer: 0,
    explanation: "(x-3)(x+2) = x² - 3x + 2x - 6 = x² - x - 6 = 0",
    difficulty: "medium",
    category: "Formation",
    points: 15,
  },

  // Physics - Newton's Laws
  {
    id: 11,
    topicId: 2,
    question: "What is Newton's First Law also known as?",
    options: ["Law of Inertia", "Law of Acceleration", "Law of Action-Reaction", "Law of Gravity"],
    correctAnswer: 0,
    explanation: "Newton's First Law is the Law of Inertia: an object at rest stays at rest, and an object in motion stays in motion unless acted upon by a force.",
    difficulty: "easy",
    category: "Concept",
    points: 5,
  },
  {
    id: 12,
    topicId: 2,
    question: "Newton's Second Law is expressed as:",
    options: ["F = m/a", "F = ma", "F = a/m", "F = m + a"],
    correctAnswer: 1,
    explanation: "F = ma (Force equals mass times acceleration)",
    difficulty: "easy",
    category: "Formula",
    points: 5,
  },
  {
    id: 13,
    topicId: 2,
    question: "If a 5kg object accelerates at 2 m/s², what is the net force?",
    options: ["10 N", "5 N", "2.5 N", "7 N"],
    correctAnswer: 0,
    explanation: "F = ma = 5 kg × 2 m/s² = 10 N",
    difficulty: "medium",
    category: "Calculation",
    points: 10,
  },
  {
    id: 14,
    topicId: 2,
    question: "Newton's Third Law states:",
    options: [
      "Force equals mass times acceleration",
      "For every action, there is an equal and opposite reaction",
      "Objects at rest stay at rest",
      "Acceleration is proportional to force"
    ],
    correctAnswer: 1,
    explanation: "Newton's Third Law: For every action, there is an equal and opposite reaction.",
    difficulty: "easy",
    category: "Concept",
    points: 5,
  },
  {
    id: 15,
    topicId: 2,
    question: "What happens to acceleration if mass doubles while force stays constant?",
    options: ["Doubles", "Halves", "Stays the same", "Quadruples"],
    correctAnswer: 1,
    explanation: "From F=ma, if F is constant and m doubles, a must halve to maintain the equation.",
    difficulty: "medium",
    category: "Application",
    points: 10,
  },
  {
    id: 16,
    topicId: 2,
    question: "Inertia depends on:",
    options: ["Velocity", "Mass", "Force", "Acceleration"],
    correctAnswer: 1,
    explanation: "Inertia is the resistance to change in motion and depends only on mass.",
    difficulty: "easy",
    category: "Concept",
    points: 5,
  },
  {
    id: 17,
    topicId: 2,
    question: "A 10N force acts on a 2kg object. What is its acceleration?",
    options: ["5 m/s²", "20 m/s²", "2 m/s²", "10 m/s²"],
    correctAnswer: 0,
    explanation: "a = F/m = 10N / 2kg = 5 m/s²",
    difficulty: "medium",
    category: "Calculation",
    points: 10,
  },
  {
    id: 18,
    topicId: 2,
    question: "When you push against a wall, the wall pushes back with:",
    options: ["More force", "Less force", "Equal force", "No force"],
    correctAnswer: 2,
    explanation: "By Newton's Third Law, the wall exerts an equal and opposite force.",
    difficulty: "easy",
    category: "Application",
    points: 5,
  },

  // English Literature - Sonnets
  {
    id: 19,
    topicId: 3,
    question: "How many lines are in a Shakespearean sonnet?",
    options: ["10", "12", "14", "16"],
    correctAnswer: 2,
    explanation: "A Shakespearean sonnet has 14 lines.",
    difficulty: "easy",
    category: "Structure",
    points: 5,
  },
  {
    id: 20,
    topicId: 3,
    question: "What is the rhyme scheme of a Shakespearean sonnet?",
    options: ["AABB CCDD EEFF GG", "ABAB CDCD EFEF GG", "ABBA CDDC EFFE GG", "AAAA BBBB CCCC DD"],
    correctAnswer: 1,
    explanation: "The rhyme scheme is ABAB CDCD EFEF GG.",
    difficulty: "medium",
    category: "Structure",
    points: 10,
  },
  {
    id: 21,
    topicId: 3,
    question: "What is a volta in a sonnet?",
    options: [
      "The final couplet",
      "A turn or shift in thought",
      "The rhyme scheme",
      "The opening line"
    ],
    correctAnswer: 1,
    explanation: "A volta is a turn or shift in thought, usually at line 9 or in the final couplet.",
    difficulty: "medium",
    category: "Literary Device",
    points: 10,
  },
  {
    id: 22,
    topicId: 3,
    question: "What meter do sonnets typically use?",
    options: ["Trochaic tetrameter", "Iambic pentameter", "Dactylic hexameter", "Anapestic trimeter"],
    correctAnswer: 1,
    explanation: "Sonnets use iambic pentameter (10 syllables per line, unstressed-stressed pattern).",
    difficulty: "medium",
    category: "Meter",
    points: 10,
  },
  {
    id: 23,
    topicId: 3,
    question: "How many quatrains are in a Shakespearean sonnet?",
    options: ["2", "3", "4", "5"],
    correctAnswer: 1,
    explanation: "A Shakespearean sonnet has three quatrains (4-line stanzas) and a final couplet.",
    difficulty: "easy",
    category: "Structure",
    points: 5,
  },
  {
    id: 24,
    topicId: 3,
    question: "What is the purpose of the final couplet?",
    options: [
      "To introduce the theme",
      "To provide conclusion or twist",
      "To extend the metaphor",
      "To follow the rhyme scheme"
    ],
    correctAnswer: 1,
    explanation: "The final couplet typically provides a conclusion, summary, or twist to the themes.",
    difficulty: "medium",
    category: "Purpose",
    points: 10,
  },
  {
    id: 25,
    topicId: 3,
    question: "Common themes in Shakespeare's sonnets include:",
    options: [
      "Science and technology",
      "Love, beauty, and mortality",
      "Politics and war",
      "Nature and animals"
    ],
    correctAnswer: 1,
    explanation: "Common themes include love, beauty, time, mortality, and the immortality of art.",
    difficulty: "easy",
    category: "Theme",
    points: 5,
  },
  {
    id: 26,
    topicId: 3,
    question: "What is iambic pentameter?",
    options: [
      "5 stressed syllables per line",
      "5 pairs of unstressed-stressed syllables",
      "10 stressed syllables per line",
      "5 lines with 10 syllables each"
    ],
    correctAnswer: 1,
    explanation: "Iambic pentameter has 5 iambs (unstressed-stressed pairs), totaling 10 syllables per line.",
    difficulty: "medium",
    category: "Meter",
    points: 10,
  },
  {
    id: 27,
    topicId: 3,
    question: "Sonnet 18 begins with which famous line?",
    options: [
      "Let me not to the marriage of true minds",
      "Shall I compare thee to a summer's day?",
      "My mistress' eyes are nothing like the sun",
      "When in disgrace with fortune and men's eyes"
    ],
    correctAnswer: 1,
    explanation: "Sonnet 18 begins: 'Shall I compare thee to a summer's day?'",
    difficulty: "easy",
    category: "Literature",
    points: 5,
  },
  {
    id: 28,
    topicId: 3,
    question: "The Italian name for a sonnet is:",
    options: ["Petrarchan", "Spenserian", "Miltonic", "Romantic"],
    correctAnswer: 0,
    explanation: "The Italian sonnet is also called a Petrarchan sonnet, named after Petrarch.",
    difficulty: "medium",
    category: "History",
    points: 10,
  },
  {
    id: 29,
    topicId: 3,
    question: "How many syllables are typically in each line of a sonnet?",
    options: ["8", "10", "12", "14"],
    correctAnswer: 1,
    explanation: "Each line typically has 10 syllables in iambic pentameter.",
    difficulty: "easy",
    category: "Meter",
    points: 5,
  },
  {
    id: 30,
    topicId: 3,
    question: "Which literary device involves comparing two things using 'like' or 'as'?",
    options: ["Metaphor", "Simile", "Personification", "Alliteration"],
    correctAnswer: 1,
    explanation: "A simile compares two things using 'like' or 'as' (e.g., 'compare thee to a summer's day').",
    difficulty: "easy",
    category: "Literary Device",
    points: 5,
  },
];

// Calendar Events Data

export interface CalendarEvent {
  id: number | string;
  title: string;
  subject: string;
  type: "class" | "homework" | "exam" | "assignment" | "event" | "holiday";
  date: string; // YYYY-MM-DD
  startTime?: string;
  endTime?: string;
  teacher?: string;
  location?: string;
  description?: string;
  color: string;
  completed?: boolean;
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

// ── Recurring class schedule template ────────────────────────────────────────
interface ClassTemplate { day: number; subject: string; start: string; end: string; teacher: string; room: string; desc: string; color: string; }
const CLASS_TEMPLATES: ClassTemplate[] = [
  // Monday
  { day:1, subject:'Mathematics', start:'09:00', end:'10:00', teacher:'Mr. Johnson',    room:'Room 101', desc:'Quadratic Equations & Algebra',       color:'#3b82f6' },
  { day:1, subject:'Physics',     start:'11:00', end:'12:00', teacher:'Ms. Chen',        room:'Lab 2',    desc:'Mechanics & Dynamics',                color:'#a855f7' },
  { day:1, subject:'Biology',     start:'14:00', end:'15:00', teacher:'Dr. Adams',       room:'Lab 3',    desc:'Cell Biology & Organelles',           color:'#10b981' },
  // Tuesday
  { day:2, subject:'English',     start:'09:00', end:'10:00', teacher:'Mr. Williams',   room:'Room 203', desc:'Literature Analysis — Shakespeare',   color:'#22c55e' },
  { day:2, subject:'History',     start:'10:30', end:'11:30', teacher:'Prof. Thompson', room:'Room 302', desc:'Modern World History',                color:'#f59e0b' },
  { day:2, subject:'Mathematics', start:'14:00', end:'15:00', teacher:'Mr. Johnson',    room:'Room 101', desc:'Problem Solving Workshop',             color:'#3b82f6' },
  // Wednesday
  { day:3, subject:'Chemistry',   start:'09:00', end:'10:30', teacher:'Dr. Martinez',   room:'Lab 1',    desc:'Chemical Reactions & Bonding',        color:'#ef4444' },
  { day:3, subject:'Biology',     start:'11:00', end:'12:00', teacher:'Dr. Adams',       room:'Lab 3',    desc:'Genetics & Heredity',                 color:'#10b981' },
  { day:3, subject:'Physics',     start:'14:00', end:'15:30', teacher:'Ms. Chen',        room:'Lab 2',    desc:'Practical Lab: Force Experiments',    color:'#a855f7' },
  // Thursday
  { day:4, subject:'English',     start:'09:00', end:'10:00', teacher:'Mr. Williams',   room:'Room 203', desc:'Creative Writing Workshop',           color:'#22c55e' },
  { day:4, subject:'History',     start:'11:00', end:'12:00', teacher:'Prof. Thompson', room:'Room 302', desc:'Research & Source Analysis',          color:'#f59e0b' },
  { day:4, subject:'Mathematics', start:'14:00', end:'15:00', teacher:'Mr. Johnson',    room:'Room 101', desc:'Functions & Graphing',                color:'#3b82f6' },
  // Friday
  { day:5, subject:'Chemistry',   start:'09:00', end:'10:30', teacher:'Dr. Martinez',   room:'Lab 1',    desc:'Stoichiometry & Reactions',           color:'#ef4444' },
  { day:5, subject:'Physics',     start:'11:00', end:'12:00', teacher:'Ms. Chen',        room:'Lab 2',    desc:'Forces & Motion Review',              color:'#a855f7' },
  { day:5, subject:'English',     start:'14:00', end:'15:00', teacher:'Mr. Williams',   room:'Room 203', desc:'Essay Writing & Analysis',            color:'#22c55e' },
];

const generateWeekClasses = (weekOffset: number, startId: number): CalendarEvent[] => {
  const now = new Date(); now.setHours(0,0,0,0);
  return CLASS_TEMPLATES.map((t, i) => {
    const dateStr = getWeekDay(t.day, weekOffset);
    const eventDate = new Date(dateStr + 'T00:00:00');
    const isPast  = eventDate < now;
    const isToday = eventDate.getTime() === now.getTime();
    return {
      id: startId + i,
      title: t.subject,
      subject: t.subject,
      type: 'class' as const,
      date: dateStr,
      startTime: t.start,
      endTime: t.end,
      teacher: t.teacher,
      location: t.room,
      description: t.desc,
      color: t.color,
      completed: isPast || (isToday && t.start < '12:00'),
      actionUrl: '/subjects',
    };
  });
};

export const calendarEvents: CalendarEvent[] = [
  // ── TODAY (offset 0) ─────────────────────────────────────────────────────
  {
    id: 1,
    title: 'Math Homework: Quadratic Equations',
    subject: 'Mathematics',
    type: 'homework',
    date: getRelativeDate(0),
    teacher: 'Mr. Johnson',
    description: 'Complete flashcards and objective questions',
    color: '#3b82f6',
    completed: false,
    priority: 'high',
    actionUrl: '/homework',
  },
  {
    id: 2,
    title: "Physics Homework: Newton's Laws",
    subject: 'Physics',
    type: 'homework',
    date: getRelativeDate(0),
    teacher: 'Ms. Chen',
    description: 'Complete flashcards and objective questions',
    color: '#a855f7',
    completed: false,
    priority: 'high',
    actionUrl: '/homework',
  },
  {
    id: 3,
    title: 'English Homework: Sonnets',
    subject: 'English',
    type: 'homework',
    date: getRelativeDate(0),
    teacher: 'Mr. Williams',
    description: 'Analyze Sonnet 18 and complete flashcards',
    color: '#22c55e',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },

  // ── TOMORROW (offset +1) ──────────────────────────────────────────────────
  {
    id: 4,
    title: 'Biology Exam',
    subject: 'Biology',
    type: 'exam',
    date: getRelativeDate(1),
    startTime: '10:30',
    endTime: '12:00',
    teacher: 'Dr. Adams',
    location: 'Hall A',
    description: 'Chapter 3–5: Cell Biology and Genetics',
    color: '#10b981',
    priority: 'high',
    actionUrl: '/subjects',
  },
  {
    id: 5,
    title: 'History Assignment Due',
    subject: 'History',
    type: 'assignment',
    date: getRelativeDate(1),
    teacher: 'Prof. Thompson',
    description: 'World War II Research Paper (5 pages)',
    color: '#f59e0b',
    priority: 'high',
    actionUrl: '/subjects',
  },

  // ── DAY +2 ────────────────────────────────────────────────────────────────
  {
    id: 6,
    title: 'Chemistry Quiz',
    subject: 'Chemistry',
    type: 'exam',
    date: getRelativeDate(2),
    startTime: '14:00',
    endTime: '15:00',
    teacher: 'Dr. Martinez',
    location: 'Room 305',
    description: 'Periodic Table and Chemical Bonding',
    color: '#ef4444',
    priority: 'medium',
    actionUrl: '/subjects',
  },
  {
    id: 7,
    title: 'Math Homework: Graphing Functions',
    subject: 'Mathematics',
    type: 'homework',
    date: getRelativeDate(2),
    teacher: 'Mr. Johnson',
    description: 'Graph quadratic functions and identify key features',
    color: '#3b82f6',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },

  // ── DAY +3 ────────────────────────────────────────────────────────────────
  {
    id: 8,
    title: 'Physics Project Submission',
    subject: 'Physics',
    type: 'assignment',
    date: getRelativeDate(3),
    teacher: 'Ms. Chen',
    description: "Newton's Laws Demonstration Project",
    color: '#a855f7',
    priority: 'high',
    actionUrl: '/subjects',
  },
  {
    id: 9,
    title: 'Chemistry Homework: Reactions',
    subject: 'Chemistry',
    type: 'homework',
    date: getRelativeDate(3),
    teacher: 'Dr. Martinez',
    description: 'Balance equations and reaction types quiz prep',
    color: '#ef4444',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },

  // ── DAY +4 ────────────────────────────────────────────────────────────────
  {
    id: 10,
    title: 'English Essay Due',
    subject: 'English',
    type: 'assignment',
    date: getRelativeDate(4),
    teacher: 'Mr. Williams',
    description: 'Sonnet Analysis Essay (3 pages)',
    color: '#22c55e',
    priority: 'medium',
    actionUrl: '/subjects',
  },

  // ── DAY +5 ────────────────────────────────────────────────────────────────
  {
    id: 11,
    title: 'Math Mid-Term Exam',
    subject: 'Mathematics',
    type: 'exam',
    date: getRelativeDate(5),
    startTime: '09:00',
    endTime: '11:00',
    teacher: 'Mr. Johnson',
    location: 'Hall B',
    description: 'Chapters 1–4: Algebra and Functions',
    color: '#3b82f6',
    priority: 'high',
    actionUrl: '/subjects',
  },

  // ── DAY +6 ────────────────────────────────────────────────────────────────
  {
    id: 12,
    title: 'Chemistry Lab Report',
    subject: 'Chemistry',
    type: 'assignment',
    date: getRelativeDate(6),
    teacher: 'Dr. Martinez',
    description: 'Chemical Reactions Lab Analysis',
    color: '#ef4444',
    priority: 'medium',
    actionUrl: '/subjects',
  },

  // ── NEXT WEEK ─────────────────────────────────────────────────────────────
  {
    id: 13,
    title: 'Science Fair',
    subject: 'Science',
    type: 'event',
    date: getRelativeDate(7),
    startTime: '10:00',
    endTime: '16:00',
    location: 'School Auditorium',
    description: 'Annual Science Fair — Project Presentations',
    color: '#8b5cf6',
    priority: 'medium',
  },
  {
    id: 14,
    title: 'Math Homework: Functions',
    subject: 'Mathematics',
    type: 'homework',
    date: getRelativeDate(7),
    teacher: 'Mr. Johnson',
    description: 'Domain, range and function transformations',
    color: '#3b82f6',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },
  {
    id: 15,
    title: 'Biology Lab Report',
    subject: 'Biology',
    type: 'assignment',
    date: getRelativeDate(8),
    teacher: 'Dr. Adams',
    description: 'Cell Structure Lab Report',
    color: '#10b981',
    priority: 'medium',
    actionUrl: '/subjects',
  },
  {
    id: 16,
    title: 'Physics Homework: Energy',
    subject: 'Physics',
    type: 'homework',
    date: getRelativeDate(8),
    teacher: 'Ms. Chen',
    description: 'Complete energy & work flashcards',
    color: '#a855f7',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },
  {
    id: 17,
    title: 'Biology Homework: Genetics',
    subject: 'Biology',
    type: 'homework',
    date: getRelativeDate(9),
    teacher: 'Dr. Adams',
    description: 'Complete genetics worksheet and flashcards',
    color: '#10b981',
    completed: false,
    priority: 'medium',
    actionUrl: '/homework',
  },
  {
    id: 18,
    title: 'History Mid-Term',
    subject: 'History',
    type: 'exam',
    date: getRelativeDate(10),
    startTime: '09:00',
    endTime: '10:30',
    teacher: 'Prof. Thompson',
    location: 'Hall C',
    description: 'World Wars & 20th Century Events',
    color: '#f59e0b',
    priority: 'high',
    actionUrl: '/subjects',
  },
  {
    id: 19,
    title: 'English Mid-Term Essay',
    subject: 'English',
    type: 'assignment',
    date: getRelativeDate(11),
    teacher: 'Mr. Williams',
    description: 'Extended literary analysis essay — 5 pages',
    color: '#22c55e',
    priority: 'high',
    actionUrl: '/subjects',
  },
  {
    id: 20,
    title: 'Sports Day',
    subject: 'School Event',
    type: 'event',
    date: getRelativeDate(14),
    startTime: '08:00',
    endTime: '16:00',
    location: 'School Grounds',
    description: 'Annual Sports Day — Inter-class competitions',
    color: '#06b6d4',
    priority: 'low',
  },

  // ── RECURRING WEEKLY CLASSES (last week → 2 weeks ahead) ─────────────────
  ...generateWeekClasses(-1, 200),
  ...generateWeekClasses(0,  220),
  ...generateWeekClasses(1,  240),
  ...generateWeekClasses(2,  260),
];

// Notifications Data
export interface Notification {
  id: number;
  type: "homework" | "deadline" | "reminder" | "announcement" | "grade";
  title: string;
  message: string;
  timestamp: string; // ISO format
  read: boolean;
  priority: "low" | "medium" | "high";
  actionUrl?: string;
  icon?: string;
  color?: string;
}

export const notifications: Notification[] = [
  {
    id: 1,
    type: "homework",
    title: "New Homework Assigned",
    message: "Quadratic Equations homework is now available. Complete flashcards and questions by today.",
    timestamp: getRelativeTimestamp(0, 8, 0),
    read: false,
    priority: "high",
    actionUrl: "/homework",
    icon: "📚",
    color: "#3b82f6",
  },
  {
    id: 2,
    type: "deadline",
    title: "Homework Due Today",
    message: "Physics: Newton's Laws homework is due today at 11:59 PM. Don't forget!",
    timestamp: getRelativeTimestamp(0, 7, 30),
    read: false,
    priority: "high",
    actionUrl: "/homework/2",
    icon: "⏰",
    color: "#ef4444",
  },
  {
    id: 4,
    type: "reminder",
    title: "Daily Study Reminder",
    message: "Complete today's homework to stay on top of your studies.",
    timestamp: getRelativeTimestamp(0, 6, 0),
    read: true,
    priority: "medium",
    actionUrl: "/homework",
    icon: "📚",
    color: "#3b82f6",
  },
  {
    id: 5,
    type: "deadline",
    title: "Exam Tomorrow",
    message: "Biology Exam is scheduled for tomorrow at 10:30 AM. Review your notes!",
    timestamp: getRelativeTimestamp(-1, 18, 0),
    read: false,
    priority: "high",
    actionUrl: "/schedule",
    icon: "📝",
    color: "#ef4444",
  },
  {
    id: 6,
    type: "announcement",
    title: "Class Rescheduled",
    message: "This week's Chemistry Lab has been moved to Friday afternoon.",
    timestamp: getRelativeTimestamp(-1, 16, 30),
    read: true,
    priority: "medium",
    icon: "📢",
    color: "#6366f1",
  },
  {
    id: 7,
    type: "grade",
    title: "New Grade Posted",
    message: "Your History Assignment grade is now available: 92/100 (A−)",
    timestamp: getRelativeTimestamp(-1, 15, 0),
    read: true,
    priority: "low",
    actionUrl: "/grades",
    icon: "✅",
    color: "#22c55e",
  },
  {
    id: 8,
    type: "homework",
    title: "New Topic Available",
    message: "English: Shakespearean Sonnets homework has been generated. Start learning!",
    timestamp: getRelativeTimestamp(-1, 14, 0),
    read: true,
    priority: "medium",
    actionUrl: "/homework/3",
    icon: "📚",
    color: "#22c55e",
  },
  {
    id: 9,
    type: "reminder",
    title: "Assignment Due Soon",
    message: "History Research Paper is due in 2 days. Have you started?",
    timestamp: getRelativeTimestamp(-1, 12, 0),
    read: true,
    priority: "medium",
    actionUrl: "/schedule",
    icon: "⚠️",
    color: "#f59e0b",
  },
];