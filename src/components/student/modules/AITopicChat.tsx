import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageCircle,
  Send,
  X,
  Bot,
  User,
  Sparkles,
  Lightbulb,
  BookOpen,
  HelpCircle,
  Lock,
} from "lucide-react";
import { Card } from "@/components/student/ui/card";
import { Button } from "@/components/student/ui/button";
import { Badge } from "@/components/student/ui/badge";
import { aiService } from "@/services/aiService";
import { useAIFeatureEnabled } from "@/hooks/useAIFeatureEnabled";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AITopicChatProps {
  topicName: string;
  subjectName: string;
  studentLevel?: string;
  curriculumTags?: string[];
}

export function AITopicChat({ 
  topicName, 
  subjectName, 
  studentLevel = "Standard", 
  curriculumTags = [] 
}: AITopicChatProps) {
  const { isEnabled: isAIEnabled, getDisabledMessage } = useAIFeatureEnabled();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: `Hi! I'm your AI learning assistant for **${topicName}**. I'm here to help you understand the concepts better, answer questions, and provide clarifications. What would you like to know?`,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Suggested questions based on topic
  const suggestedQuestions = [
    `What are the key concepts in ${topicName}?`,
    `Can you explain ${topicName} with an example?`,
    `What are common mistakes in ${topicName}?`,
    `How is ${topicName} used in real life?`,
  ];

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    // Convert current messages to format expected by API
    const formattedHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // The service expects: (subject, topic, chatHistory, newMessage, studentLevel, curriculumTags)
    const response = await aiService.chatTopic(
      subjectName, 
      topicName, 
      formattedHistory, 
      userMessage,
      studentLevel,
      curriculumTags
    );
    return response;
  };

  const handleSendMessage = async (directMessage?: string) => {
    const messageToSend = directMessage || inputMessage;
    if (!messageToSend.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!directMessage) setInputMessage("");
    setIsTyping(true);

    // Fetch AI response
    try {
      const responseContent = await generateAIResponse(messageToSend);
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    } catch (err) {
      console.error("AI Chat failed:", err);
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I encountered an error while processing your request. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  // If AI features are disabled, show a locked/grayed-out chat button that explains why
  if (!isAIEnabled) {
    return (
      <>
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              style={{ 
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 999999 
              }}
            >
              <Button
                onClick={() => setIsOpen(true)}
                className="w-16 h-16 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-500 shadow-lg transition-colors border-4 border-gray-100 cursor-not-allowed"
                size="lg"
              >
                <Lock className="w-7 h-7" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="shadow-2xl flex flex-col"
              style={{ 
                position: 'fixed',
                bottom: '100px',
                right: '24px',
                width: '340px',
                maxWidth: 'calc(100vw - 48px)',
                zIndex: 999999 
              }}
            >
              <Card className="shadow-2xl border border-gray-200 overflow-hidden bg-white">
                <div className="bg-gray-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-300 rounded-lg">
                      <Lock className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-gray-600">AI Learning Assistant</h3>
                      <p className="text-xs text-gray-400">Feature Disabled</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:bg-gray-200 h-8 w-8 p-1 rounded-full"
                  >
                    <X className="w-6 h-6" />
                  </Button>
                </div>
                <div className="p-6 text-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-700 mb-2">AI Features Disabled</h4>
                  <p className="text-sm text-gray-500 leading-relaxed">{getDisabledMessage()}</p>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            style={{ 
              position: 'fixed',
              bottom: '24px',
              right: '24px',
              zIndex: 999999 
            }}
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg transition-colors border-4 border-blue-100"
              size="lg"
            >
              <div className="relative">
                <MessageCircle className="w-7 h-7" />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white"
                />
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="shadow-2xl flex flex-col"
            style={{ 
              position: 'fixed',
              bottom: '100px',
              right: '24px',
              width: '400px',
              maxWidth: 'calc(100vw - 48px)',
              height: '600px',
              maxHeight: 'calc(100vh - 120px)',
              zIndex: 999999 
            }}
          >
            <Card className="shadow-2xl border border-gray-200 overflow-hidden h-full w-full flex flex-col bg-white">
              {/* Chat Header */}
               <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4 text-white flex-shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm flex-shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate">AI Learning Assistant</h3>
                      <p className="text-xs text-white/80 truncate">{subjectName} • {topicName}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-white hover:bg-white/20 h-8 w-8 p-1 flex-shrink-0 rounded-full"
                  >
                    <X className="w-6 h-6" strokeWidth={2.5} />
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 overflow-y-auto p-3 bg-gray-50 space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${
                      message.role === "user" ? "flex-row-reverse" : ""
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === "assistant"
                          ? "bg-gradient-to-br from-purple-400 to-blue-400"
                          : "bg-gradient-to-br from-green-400 to-teal-400"
                      }`}
                    >
                      {message.role === "assistant" ? (
                        <Bot className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>

                    {/* Message Bubble */}
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                        message.role === "assistant"
                          ? "bg-white border border-gray-200 text-gray-800"
                          : "bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-br-none"
                      }`}
                    >
                      <p
                        className={`text-xs whitespace-pre-wrap ${
                          message.role === "user" ? "text-white" : "text-gray-800"
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: message.content
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>"),
                        }}
                      />
                      <p
                        className={`text-[10px] mt-1 ${
                          message.role === "user" ? "text-white/70" : "text-gray-500"
                        }`}
                      >
                        {message.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 flex items-center justify-center">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl px-3 py-2">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                        />
                        <motion.div
                          animate={{ y: [0, -5, 0] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                          className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} className="h-1 flex-shrink-0" />
              </div>

              {/* Suggested Questions */}
              {messages.length <= 2 && (
                <div className="p-2.5 bg-white border-t border-gray-200 flex-shrink-0">
                  <p className="text-[10px] text-gray-600 mb-1.5 flex items-center gap-1">
                    <Lightbulb className="w-3 h-3" />
                    Quick questions:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedQuestions.slice(0, 2).map((question, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(question)}
                        className="text-[11px] px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors text-left"
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-200 flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask a question..."
                    className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full text-xs focus:outline-none focus:border-purple-500"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-full px-3 h-9 w-9 flex items-center justify-center p-0 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                    AI-Powered
                  </Badge>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    <HelpCircle className="w-2.5 h-2.5 mr-0.5" />
                    24/7 Available
                  </Badge>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}