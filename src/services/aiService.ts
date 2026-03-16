// =============================================================================
// AI Service — Groq API integration
// Set VITE_GROQ_API_KEY in your .env file.
// =============================================================================

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = 'llama-3.3-70b-versatile';

interface GroqMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Helper to call the Groq API
 */
async function callGroq(messages: GroqMessage[], model = DEFAULT_MODEL, jsonMode = false): Promise<string> {
    if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
        console.warn('[aiService] VITE_GROQ_API_KEY not set or invalid. Returning placeholder response.');
        if (jsonMode) return '[]';
        return `[AI response placeholder — set VITE_GROQ_API_KEY in .env]`;
    }

    try {
        const body: any = {
            model,
            messages,
        };

        if (jsonMode) {
             body.response_format = { type: "json_object" };
        }

        const response = await fetch(GROQ_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Groq API Error Details:', errorData);
            throw new Error(`Groq API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content ?? '';
    } catch (error) {
        console.error("Failed to fetch from Groq:", error);
        throw error;
    }
}

// ── Domain-specific AI helpers ────────────────────────────────────────────────

export const aiService = {
    /**
     * Generate flashcards as a JSON array
     */
    generateFlashcards: async (subject: string, topic: string, studentLevel: string = "Grade 10", count: number = 10): Promise<any[]> => {
        const prompt = `You are an expert ${subject} teacher specialized in pedagogical learning for ${studentLevel} students. 
        Create exactly ${count} flashcards for the topic: "${topic}".
        
        Follow these pedagogical principles:
        1. Start with fundamental definitions.
        2. Move to core concepts and principles.
        3. Include practical applications or problem-solving cards.
        4. Use clear, age-appropriate language for ${studentLevel}.

        Respond ONLY with a JSON object containing a "flashcards" array. Each object in the array MUST have the following keys:
        - "front": The question or concept to test.
        - "back": The concise answer or explanation.
        - "category": A short category label (e.g., "Definition", "Concept", "Application", "Formula").
        
        Do not include any formatting markdown (like \`\`\`json) or extra text. Pure valid JSON only.`;

        const messages: GroqMessage[] = [
            { role: 'system', content: 'You are a pedagogical education assistant that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callGroq(messages, DEFAULT_MODEL, true);
            const parsed = JSON.parse(responseText);
            return parsed.flashcards || [];
        } catch (error) {
            console.error("Failed to parse flashcards:", error);
            // Fallback for demo if api key is missing
            return [
                 { id: 1, front: `What is the core concept of ${topic}?`, back: `Placeholder for ${topic} core concept.`, category: "Concept" },
                 { id: 2, front: `How is ${topic} applied?`, back: `Placeholder for ${topic} application.`, category: "Application" }
            ];
        }
    },

    /**
     * Generate objective quiz questions as a JSON array
     */
    generateQuiz: async (subject: string, topic: string, studentLevel: string = "Grade 10", count: number = 10): Promise<any[]> => {
        const prompt = `You are an expert ${subject} assessor specialized in pedagogical assessment for ${studentLevel} students. 
        Create exactly ${count} multiple-choice questions for the topic: "${topic}".
        
        Follow these pedagogical principles for assessment:
        1. Mix factual recall with conceptual understanding.
        2. Ensure questions are challenging but appropriate for ${studentLevel}.
        3. Provide detailed explanations that help the student learn from their mistakes.
        4. Distractors (wrong options) should be plausible based on common misconceptions.

        Respond ONLY with a JSON object containing a "questions" array. Each object in the array MUST have the following keys:
        - "question": The multiple-choice question text.
        - "options": An array of exactly 4 string options.
        - "correctAnswer": The integer index (0-3) of the correct option.
        - "explanation": A helpful, educational explanation of why the answer is correct and why other options might be confusing.
        - "difficulty": Either "easy", "medium", or "hard".
        - "category": A short category label.
        
        Do not include any formatting markdown (like \`\`\`json) or extra text. Pure valid JSON only.`;

        const messages: GroqMessage[] = [
            { role: 'system', content: 'You are a pedagogical assessment assistant that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callGroq(messages, DEFAULT_MODEL, true);
             const parsed = JSON.parse(responseText);
             return parsed.questions || [];
        } catch (error) {
             console.error("Failed to parse quiz:", error);
             return [];
        }
    },

    /**
     * Generate a comprehensive subject overview using pedagogical principles
     */
    generateSubjectOverview: async (subject: string, topic: string, studentLevel: string = "Grade 10"): Promise<any> => {
        const prompt = `You are a world-class ${subject} educator. Generate a personalized, pedagogical learning guide for a ${studentLevel} student for the topic: "${topic}".
        
        The overview must include:
        1. A clear "mainTopic" name.
        2. A "description" that hooks the student and explains why this matters.
        3. 5 specific "learningObjectives" starting with action verbs (e.g., "Identify", "Analyze").
        4. 5 core "keyPoints" representing the essential knowledge.
        5. A "pedagogicalSummary" (overview) that explains the topic in a way that builds intuition.

        Respond ONLY with a JSON object with the following keys:
        - "mainTopic": string
        - "description": string
        - "learningObjectives": string[]
        - "keyPoints": string[]
        - "overview": string
        
        Keep explanations clear, encouraging, and appropriate for ${studentLevel}. Pure valid JSON only.`;

        const messages: GroqMessage[] = [
            { role: 'system', content: 'You are a pedagogical content expert that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callGroq(messages, DEFAULT_MODEL, true);
            return JSON.parse(responseText);
        } catch (error) {
            console.error("Failed to generate subject overview:", error);
            return null;
        }
    },

    /**
     * Contextual Chat for a specific topic
     */
     chatTopic: async (subject: string, topic: string, chatHistory: {role: 'user' | 'assistant', content: string}[], newMessage: string): Promise<string> => {
        const messages: GroqMessage[] = [
            { 
               role: 'system', 
               content: `You are a friendly, encouraging AI tutor helping a student master the topic "${topic}" in the subject "${subject}". 
               Keep your responses concise, easily readable (use formatting like bolding or bullet points where appropriate), and focused purely on educational assistance.` 
            },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: newMessage }
        ];

        return callGroq(messages);
     },

     // Backward compatibility for existing methods
     generateLessonContent: async (subject: string, topic: string, gradeLevel: string): Promise<string> => {
        const prompt = `You are an expert educator. Create a comprehensive lesson plan for:\nSubject: ${subject}\nTopic: ${topic}\nGrade: ${gradeLevel}\n\nInclude: learning objectives, key concepts, activities, and assessment ideas.`;
        return callGroq([{ role: 'user', content: prompt }]);
    },

    summarizeStudentPerformance: async (studentName: string, attendancePercentage: number, averageGrade: number, subjects: string[]): Promise<string> => {
        const prompt = `Provide a brief, constructive performance summary for a student:\nName: ${studentName}\nAttendance: ${attendancePercentage}%\nAverage Grade: ${averageGrade}%\nSubjects: ${subjects.join(', ')}\n\nGive actionable recommendations for improvement in 3-4 sentences.`;
        return callGroq([{ role: 'user', content: prompt }]);
    },

    generateParentMessage: async (studentName: string, topic: string, context: string): Promise<string> => {
        const prompt = `Write a professional, empathetic message from a school to a parent about:\nStudent: ${studentName}\nRegarding: ${topic}\nContext: ${context}\n\nKeep it concise (2-3 paragraphs), professional, and solution-focused.`;
        return callGroq([{ role: 'user', content: prompt }]);
    },

    prompt: async (text: string): Promise<string> => {
        return callGroq([{ role: 'user', content: text }]);
    },
};
