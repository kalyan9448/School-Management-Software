import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  BookOpen,
  Target,
  Trophy,
  Edit,
  Camera,
  ArrowLeft,
  Plus,
  X,
  Sparkles,
  Brain,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { Avatar, AvatarFallback } from "@/components/student/ui/avatar";
import { Progress } from "@/components/student/ui/progress";
import { useNavigate } from "react-router";
import { StudentProfile, SkillsData } from "@/services/student/studentDataService";

export function ProfilePage() {
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState<any>({ name: "", grade: "", email: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  // Load skills from Firestore
  const [skills, setSkills] = useState<string[]>(["Mathematics", "Physics"]);

  useEffect(() => {
    (async () => {
      const [profile, skillsArr] = await Promise.all([
        StudentProfile.get(),
        SkillsData.getAll(),
      ]);
      setStudentData(profile);
      if (skillsArr.length > 0) {
        setSkills(skillsArr.map((s: any) => s.skill || s));
      }
    })();
  }, []);

  // Suggested skills based on profile
  const suggestedSkills = [
    "Computer Science",
    "Data Science",
    "Artificial Intelligence",
    "Web Development",
    "Robotics",
    "Chemistry",
    "Biology",
    "Psychology",
    "Economics",
    "Literature",
  ].filter((skill) => !skills.includes(skill));

  // Save skills whenever they change
  const saveSkills = (updatedSkills: string[]) => {
    setSkills(updatedSkills);
  };

  const handleAddSkill = (skill: string) => {
    if (skill && !skills.includes(skill)) {
      saveSkills([...skills, skill]);
      setNewSkill("");
      setShowAddSkill(false);
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    saveSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Specialized classes based on selected skills
  const getSpecializedClasses = () => {
    const classesMap: Record<string, any[]> = {
      "Computer Science": [
        {
          title: "Advanced Python Programming",
          teacher: "Dr. Sarah Chen",
          level: "Advanced",
          modules: 12,
          enrolled: 234,
        },
        {
          title: "Data Structures & Algorithms",
          teacher: "Prof. Michael Roberts",
          level: "Intermediate",
          modules: 15,
          enrolled: 456,
        },
      ],
      "Data Science": [
        {
          title: "Machine Learning Fundamentals",
          teacher: "Dr. Emily Watson",
          level: "Advanced",
          modules: 10,
          enrolled: 189,
        },
        {
          title: "Statistical Analysis with R",
          teacher: "Prof. James Miller",
          level: "Intermediate",
          modules: 8,
          enrolled: 234,
        },
      ],
      "Artificial Intelligence": [
        {
          title: "Neural Networks & Deep Learning",
          teacher: "Dr. Alex Kumar",
          level: "Advanced",
          modules: 14,
          enrolled: 167,
        },
        {
          title: "Natural Language Processing",
          teacher: "Prof. Lisa Anderson",
          level: "Advanced",
          modules: 11,
          enrolled: 145,
        },
      ],
      "Web Development": [
        {
          title: "Full Stack Web Development",
          teacher: "Mr. David Park",
          level: "Intermediate",
          modules: 16,
          enrolled: 567,
        },
        {
          title: "React & Modern JavaScript",
          teacher: "Ms. Jennifer Lee",
          level: "Intermediate",
          modules: 10,
          enrolled: 432,
        },
      ],
      Mathematics: [
        {
          title: "Calculus III: Multivariable",
          teacher: "Prof. Robert Johnson",
          level: "Advanced",
          modules: 12,
          enrolled: 345,
        },
      ],
      Physics: [
        {
          title: "Quantum Mechanics Introduction",
          teacher: "Dr. Maria Garcia",
          level: "Advanced",
          modules: 14,
          enrolled: 234,
        },
      ],
    };

    const allClasses: any[] = [];
    skills.forEach((skill) => {
      if (classesMap[skill]) {
        allClasses.push(...classesMap[skill].map((c) => ({ ...c, skill })));
      }
    });
    return allClasses;
  };

  const specializedClasses = getSpecializedClasses();

  // AI Recommendations based on skills and performance
  const getAIRecommendations = () => {
    const recommendations = [];

    if (skills.includes("Computer Science")) {
      recommendations.push({
        type: "Course",
        title: "Advanced Algorithms & Competitive Programming",
        reason: "Based on your strong performance in Computer Science",
        icon: "🎯",
      });
    }

    if (skills.includes("Mathematics") && skills.includes("Computer Science")) {
      recommendations.push({
        type: "Skill Path",
        title: "Data Science Career Track",
        reason: "Perfect combination of Math and CS skills",
        icon: "📊",
      });
    }

    if (skills.includes("Artificial Intelligence")) {
      recommendations.push({
        type: "Project",
        title: "Build Your Own AI Chatbot",
        reason: "Hands-on AI project matching your interests",
        icon: "🤖",
      });
    }

    if (skills.length >= 3) {
      recommendations.push({
        type: "Challenge",
        title: "Interdisciplinary Research Project",
        reason: "Combine multiple skills in a real-world application",
        icon: "🔬",
      });
    }

    return recommendations;
  };

  const aiRecommendations = getAIRecommendations();

  const profileStats = [
    { label: "Courses Enrolled", value: 6, icon: BookOpen, color: "#1F6FEB" },
  ];


  const personalInfo = [
    { label: "Full Name", value: studentData.name, icon: User },
    { label: "Email", value: "john.doe@example.com", icon: Mail },
    { label: "Phone", value: "+1 (555) 123-4567", icon: Phone },
    { label: "Location", value: "New York, USA", icon: MapPin },
    { label: "Joined", value: "January 2024", icon: Calendar },
  ];

  const recentActivity = [
    { action: "Completed Math Quiz", date: "2 hours ago" },
    { action: "Submitted Physics Assignment", date: "2 days ago" },
    { action: "Attended Chemistry Lab", date: "3 days ago" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFBFF]">
      {/* Header */}
      <div 
        style={{ background: 'linear-gradient(to right, #0A2540, #1F6FEB)' }} 
        className="text-white p-6 md:p-10 rounded-b-[2.5rem] shadow-xl relative overflow-hidden mb-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="max-w-screen-xl mx-auto relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="text-white hover:bg-white/20 -ml-2 mb-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl md:text-4xl font-bold tracking-tight">Student Profile</h1>
              <p className="text-white/80 text-sm md:text-base mt-2 font-medium">View and manage your profile information</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 space-y-6">
        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4" style={{ borderColor: '#1F6FEB' }}>
                    <AvatarFallback
                      className="text-white text-4xl"
                      style={{ background: 'linear-gradient(135deg, #0A2540 0%, #1F6FEB 100%)' }}
                    >
                      {studentData.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    className="absolute bottom-0 right-0 p-2 bg-white rounded-full shadow-lg border-2"
                    style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                  onClick={() => setIsEditing(!isEditing)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#1A1A1A' }}>{studentData.name}</h2>
                    <p style={{ color: '#7A869A' }}>Student · Class 10</p>
                  </div>
                </div>


                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {profileStats.map((stat, index) => {
                    const Icon = stat.icon;
                    return (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        className="text-center p-3 rounded-lg"
                        style={{ background: '#FAFBFF', border: '1px solid #E6ECF5' }}
                      >
                        <Icon className="w-5 h-5 mx-auto mb-2" style={{ color: stat.color }} />
                        <p className="text-xl font-bold" style={{ color: '#1A1A1A' }}>{stat.value}</p>
                        <p className="text-xs" style={{ color: '#7A869A' }}>{stat.label}</p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>Personal Information</h3>
            <div className="space-y-4">
              {personalInfo.map((info) => {
                const Icon = info.icon;
                return (
                  <div key={info.label} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="p-2 rounded-lg" style={{ background: '#CFE8FF' }}>
                      <Icon className="w-5 h-5" style={{ color: '#1F6FEB' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs" style={{ color: '#7A869A' }}>{info.label}</p>
                      <p className="font-medium" style={{ color: '#1A1A1A' }}>{info.value}</p>
                    </div>
                    {isEditing && (
                      <Button variant="ghost" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>


        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#1A1A1A' }}>Recent Activity</h3>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: '#FAFBFF', border: '1px solid #E6ECF5' }}
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm" style={{ color: '#1A1A1A' }}>{activity.action}</p>
                    <p className="text-xs" style={{ color: '#7A869A' }}>{activity.date}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Skills & Interests Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-white border-purple-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-500 rounded-lg">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                  Skills & Interests
                </h3>
                <p className="text-sm" style={{ color: '#7A869A' }}>
                  Manage your areas of expertise for personalized recommendations
                </p>
              </div>
            </div>

            {/* Current Skills */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold" style={{ color: '#1A1A1A' }}>
                  My Skills ({skills.length})
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddSkill(!showAddSkill)}
                  style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Skill
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <motion.div
                    key={skill}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-4 py-2 rounded-full"
                    style={{ background: '#1F6FEB', color: 'white' }}
                  >
                    <span className="text-sm font-medium">{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="hover:bg-white/20 rounded-full p-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Add Skill Input */}
              {showAddSkill && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-white rounded-lg border-2 border-dashed border-purple-200"
                >
                  <p className="text-sm font-medium mb-3" style={{ color: '#1A1A1A' }}>
                    Add a new skill
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddSkill(newSkill)}
                      placeholder="e.g., Computer Science"
                      className="flex-1 px-3 py-2 border rounded-lg text-sm"
                      style={{ borderColor: '#E6ECF5' }}
                      autoFocus
                    />
                    <Button
                      onClick={() => handleAddSkill(newSkill)}
                      disabled={!newSkill.trim()}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Add
                    </Button>
                  </div>

                  {/* Quick Add Suggestions */}
                  <div className="mt-3">
                    <p className="text-xs mb-2" style={{ color: '#7A869A' }}>
                      Quick add:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedSkills.slice(0, 5).map((skill) => (
                        <button
                          key={skill}
                          onClick={() => handleAddSkill(skill)}
                          className="px-3 py-1 text-xs rounded-full border hover:bg-purple-50 transition-colors"
                          style={{ borderColor: '#E6ECF5', color: '#1F6FEB' }}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>

        {/* AI Recommendations Section */}
        {aiRecommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500 rounded-lg">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                    AI-Powered Recommendations
                  </h3>
                  <p className="text-sm" style={{ color: '#7A869A' }}>
                    Personalized content based on your skills and performance
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {aiRecommendations.map((rec, index) => (
                  <motion.div
                    key={rec.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="p-4 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer"
                    style={{ borderColor: '#E6ECF5' }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{rec.icon}</div>
                      <div className="flex-1">
                        <Badge
                          className="mb-2 text-xs"
                          style={{ background: '#CFE8FF', color: '#1F6FEB' }}
                        >
                          {rec.type}
                        </Badge>
                        <h4 className="font-bold text-sm mb-2" style={{ color: '#1A1A1A' }}>
                          {rec.title}
                        </h4>
                        <p className="text-xs" style={{ color: '#7A869A' }}>
                          {rec.reason}
                        </p>
                        <Button
                          size="sm"
                          className="mt-3 text-xs"
                          variant="outline"
                          style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                        >
                          <Lightbulb className="w-3 h-3 mr-2" />
                          Explore
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Specialized Classes Section */}
        {specializedClasses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6 bg-gradient-to-br from-green-50 to-white border-green-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-500 rounded-lg">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: '#1A1A1A' }}>
                    Specialized Classes for You
                  </h3>
                  <p className="text-sm" style={{ color: '#7A869A' }}>
                    Advanced courses mapped to your skill interests
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specializedClasses.map((classInfo, index) => (
                  <motion.div
                    key={classInfo.title}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 + index * 0.1 }}
                    className="p-4 bg-white rounded-lg border hover:shadow-md transition-all cursor-pointer"
                    style={{ borderColor: '#E6ECF5' }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <Badge className="bg-blue-50 text-blue-700 border-none">
                        {classInfo.subject}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs"
                        style={{ borderColor: '#1F6FEB', color: '#1F6FEB' }}
                      >
                        {classInfo.skill}
                      </Badge>
                    </div>


                    <h4 className="font-bold text-sm mb-2" style={{ color: '#1A1A1A' }}>
                      {classInfo.title}
                    </h4>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#7A869A' }}>
                        <User className="w-3 h-3" />
                        <span>{classInfo.teacher}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs" style={{ color: '#7A869A' }}>
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          <span>{classInfo.modules} modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          <span>{classInfo.enrolled} enrolled</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      className="w-full text-xs bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Enroll Now
                    </Button>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}