// =============================================================================
// AI Service — Google Gemini API integration
// Set VITE_GEMINI_API_KEY in your .env file.
// =============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

/**
 * Helper to call the Google Gemini API
 */
async function callAI(messages: ChatMessage[], model = DEFAULT_MODEL, jsonMode = false): Promise<string> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key') {
        console.warn('[aiService] VITE_GEMINI_API_KEY not set or invalid. Returning placeholder response.');
        if (jsonMode) return '{}';
        return `[AI response placeholder — set VITE_GEMINI_API_KEY in .env]`;
    }

    try {
        // Extract system instruction from messages
        const systemMsg = messages.find(m => m.role === 'system');
        const nonSystemMsgs = messages.filter(m => m.role !== 'system');

        // Build Gemini request body
        const body: any = {
            contents: nonSystemMsgs.map(msg => ({
                role: msg.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: msg.content }],
            })),
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 8192,
            },
        };

        if (systemMsg) {
            body.systemInstruction = { parts: [{ text: systemMsg.content }] };
        }

        if (jsonMode) {
            body.generationConfig.responseMimeType = 'application/json';
        }

        const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Gemini API Error Details:', errorData);
            throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
        return text;
    } catch (error) {
        console.error("Failed to fetch from Gemini:", error);
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
        Create between 5 and ${count} flashcards for the topic: "${topic}".
        You MUST generate at least 5 flashcards. Aim for ${count} if the topic has enough breadth.
        
        Follow these pedagogical principles:
        1. Start with fundamental definitions.
        2. Move to core concepts and principles.
        3. Include practical applications or problem-solving cards.
        4. Use clear, age-appropriate language for ${studentLevel}.

        Respond ONLY with a JSON object containing a "flashcards" array. Each object in the array MUST have the following keys:
        - "front": The question or concept to test.
        - "back": The concise answer or explanation.
        - "category": A short category label (e.g., "Definition", "Concept", "Application", "Formula").
        
        IMPORTANT: You MUST return at least 5 flashcards. Do not return fewer than 5.
        Do not include any formatting markdown (like \`\`\`json) or extra text. Pure valid JSON only.`;

        const messages: ChatMessage[] = [
            { role: 'system', content: 'You are a pedagogical education assistant that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callAI(messages, DEFAULT_MODEL, true);
            const parsed = JSON.parse(responseText);
            const cards = parsed.flashcards || [];
            console.log('[aiService] Parsed flashcards count:', cards.length);
            if (cards.length < 5) {
                console.warn('[aiService] Too few flashcards from AI, using fallback');
                return getFallbackFlashcards(subject, topic);
            }
            return cards;
        } catch (error) {
            console.error("Failed to parse flashcards:", error);
            return getFallbackFlashcards(subject, topic);
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
        - "correctAnswer": The integer index (0-3) of the correct option. IMPORTANT: Distribute correctAnswer randomly across 0, 1, 2, and 3. Do NOT always use 0.
        - "explanation": A helpful, educational explanation of why the answer is correct and why other options might be confusing.
        - "difficulty": Either "easy", "medium", or "hard".
        - "category": A short category label.
        
        Do not include any formatting markdown (like \`\`\`json) or extra text. Pure valid JSON only.`;

        const messages: ChatMessage[] = [
            { role: 'system', content: 'You are a pedagogical assessment assistant that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callAI(messages, DEFAULT_MODEL, true);
            console.log('[aiService] Quiz raw response length:', responseText.length);
            const parsed = JSON.parse(responseText);
            const questions = parsed.questions || [];
            console.log('[aiService] Parsed quiz questions count:', questions.length);
            if (questions.length === 0) return getFallbackQuiz(subject, topic).map(shuffleQuestionOptions);
            return questions.map(shuffleQuestionOptions);
        } catch (error) {
             console.error("Failed to parse quiz:", error);
             return getFallbackQuiz(subject, topic).map(shuffleQuestionOptions);
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

        const messages: ChatMessage[] = [
            { role: 'system', content: 'You are a pedagogical content expert that outputs valid JSON.' },
            { role: 'user', content: prompt }
        ];

        try {
            const responseText = await callAI(messages, DEFAULT_MODEL, true);
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
        const messages: ChatMessage[] = [
            { 
               role: 'system', 
               content: `You are a friendly, encouraging AI tutor helping a student master the topic "${topic}" in the subject "${subject}". 
               Keep your responses concise, easily readable (use formatting like bolding or bullet points where appropriate), and focused purely on educational assistance.` 
            },
            ...chatHistory.map(msg => ({ role: msg.role, content: msg.content })),
            { role: 'user', content: newMessage }
        ];

        return callAI(messages);
     },

     // Backward compatibility for existing methods
     generateLessonContent: async (subject: string, topic: string, gradeLevel: string): Promise<string> => {
        const prompt = `You are an expert educator. Create a comprehensive lesson plan for:\nSubject: ${subject}\nTopic: ${topic}\nGrade: ${gradeLevel}\n\nInclude: learning objectives, key concepts, activities, and assessment ideas.`;
        return callAI([{ role: 'user', content: prompt }]);
    },

    summarizeStudentPerformance: async (studentName: string, attendancePercentage: number, averageGrade: number, subjects: string[]): Promise<string> => {
        const prompt = `Provide a brief, constructive performance summary for a student:\nName: ${studentName}\nAttendance: ${attendancePercentage}%\nAverage Grade: ${averageGrade}%\nSubjects: ${subjects.join(', ')}\n\nGive actionable recommendations for improvement in 3-4 sentences.`;
        return callAI([{ role: 'user', content: prompt }]);
    },

    generateParentMessage: async (studentName: string, topic: string, context: string): Promise<string> => {
        const prompt = `Write a professional, empathetic message from a school to a parent about:\nStudent: ${studentName}\nRegarding: ${topic}\nContext: ${context}\n\nKeep it concise (2-3 paragraphs), professional, and solution-focused.`;
        return callAI([{ role: 'user', content: prompt }]);
    },

    prompt: async (text: string): Promise<string> => {
        return callAI([{ role: 'user', content: text }]);
    },
};

/**
 * Provides fallback questions when AI generation fails or is rate-limited.
 */
/**
 * Shuffle a question's options and update correctAnswer so the answer
 * is no longer always at index 0 (or any fixed position).
 */
function shuffleQuestionOptions(q: any): any {
    if (!q.options || q.options.length !== 4) return q;
    const correctText = q.options[q.correctAnswer ?? 0];
    // Fisher-Yates shuffle
    const shuffled = [...q.options];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return { ...q, options: shuffled, correctAnswer: shuffled.indexOf(correctText) };
}

/**
 * Fallback flashcards when AI fails — always returns at least 5 cards.
 */
function getFallbackFlashcards(subject: string, topic: string): any[] {
    const templates = [
        { front: `What is the definition of ${topic}?`, back: `${topic} is a key concept in ${subject}. Review your textbook for the precise definition.`, category: "Definition" },
        { front: `What are the main principles of ${topic}?`, back: `The core principles of ${topic} form the foundation for understanding this area of ${subject}.`, category: "Concept" },
        { front: `How is ${topic} applied in real life?`, back: `${topic} has many practical applications in everyday scenarios related to ${subject}.`, category: "Application" },
        { front: `What is a common formula or rule associated with ${topic}?`, back: `Key formulas and rules for ${topic} can be found in your ${subject} reference material.`, category: "Formula" },
        { front: `What are common mistakes students make with ${topic}?`, back: `A frequent mistake is confusing related concepts. Always read the question carefully when dealing with ${topic}.`, category: "Common Mistakes" },
        { front: `How does ${topic} relate to other topics in ${subject}?`, back: `${topic} connects to several other areas in ${subject}. Understanding these relationships deepens your mastery.`, category: "Connections" },
        { front: `What is the historical significance of ${topic}?`, back: `${topic} has played an important role in the development of ${subject} as a field.`, category: "History" },
    ];
    return templates.map((t, i) => ({ ...t, id: i + 1 }));
}

function getFallbackQuiz(subject: string, topic: string): any[] {
    const fallbackMap: Record<string, any[]> = {
        "Shakespearean Sonnets Analysis": [
            {
                question: "What is the standard structure of a Shakespearean sonnet?",
                options: [
                    "Three quatrains and a couplet",
                    "Two octaves and a sestet",
                    "Four tercets and a couplet",
                    "A single 14-line stanza without breaks"
                ],
                correctAnswer: 0,
                explanation: "A Shakespearean (or English) sonnet consists of 14 lines: three quatrains (4 lines each) followed by a final rhyming couplet.",
                difficulty: "easy",
                category: "Structure"
            },
            {
                question: "Which rhyme scheme is characteristic of a Shakespearean sonnet?",
                options: [
                    "ABBA ABBA CDE CDE",
                    "ABAB CDCD EFEF GG",
                    "AABB CCDD EEFF GG",
                    "ABAB BCBC CDCD EE"
                ],
                correctAnswer: 1,
                explanation: "The Shakespearean sonnet follows the rhyme scheme ABAB CDCD EFEF GG.",
                difficulty: "medium",
                category: "Rhyme Scheme"
            },
            {
                question: "What is the typical meter of Shakespeare's sonnets?",
                options: [
                    "Dactylic hexameter",
                    "Anapestic tetrameter",
                    "Iambic pentameter",
                    "Trochaic octameter"
                ],
                correctAnswer: 2,
                explanation: "Shakespeare's sonnets are almost exclusively written in iambic pentameter, which mimics the natural rhythm of English speech.",
                difficulty: "easy",
                category: "Meter"
            }
        ],
        "Quadratic Equations": [
            {
                question: "What is the value of the discriminant in the quadratic formula?",
                options: ["-b", "2a", "b² - 4ac", "√(b² - 4ac)"],
                correctAnswer: 2,
                explanation: "The discriminant is the part under the square root in the quadratic formula: b² - 4ac.",
                difficulty: "easy",
                category: "Formula"
            }
        ],
        "Newton's Laws": [
            {
                question: "According to Newton's Second Law, force is equal to mass times what?",
                options: ["Velocity", "Acceleration", "Inertia", "Energy"],
                correctAnswer: 1,
                explanation: "Newton's Second Law is expressed as F = ma, where a is acceleration.",
                difficulty: "easy",
                category: "Physics"
            }
        ]
    };

    // Return specific fallback or a generic set
    // Use a non-repeating shuffled index sequence so correct positions
    // are unpredictable (never 0,1,2,3,0,1,2,3...)
    const makeGenericFallback = (count = 5) => {
        // Build a pool of indices [0,1,2,3] repeated enough times, then shuffle
        const pool: number[] = [];
        while (pool.length < count) pool.push(...[0, 1, 2, 3]);
        // Fisher-Yates shuffle the pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        const baseOptions = [
            `A key principle of ${topic}`,
            `A common misconception about ${topic}`,
            `An unrelated concept in ${subject}`,
            `A partially correct statement about ${topic}`
        ];
        return Array.from({ length: count }, (_, i) => {
            const correctIdx = pool[i];
            // Rotate base options so the correct-sounding one lands at correctIdx
            const opts = [...baseOptions];
            const temp = opts[0];
            opts[0] = opts[correctIdx];
            opts[correctIdx] = temp;
            return {
                question: `Question ${i + 1}: What is an important concept related to ${topic} in ${subject}?`,
                options: opts,
                correctAnswer: correctIdx,
                explanation: `This is a placeholder question for ${topic}. The AI quiz generator was unavailable.`,
                difficulty: i < 2 ? "easy" : i < 4 ? "medium" : "hard",
                category: "General"
            };
        });
    };

    return fallbackMap[topic] || makeGenericFallback(5);
}

