// =============================================================================
// AI Service — Google Gemini API integration
// Set VITE_GEMINI_API_KEY in your .env file.
// =============================================================================

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-pro';

interface GeminiResponse {
    candidates: Array<{
        content: { parts: Array<{ text: string }> };
    }>;
}

async function callGemini(prompt: string, model = DEFAULT_MODEL): Promise<string> {
    if (!GEMINI_API_KEY) {
        console.warn('[aiService] VITE_GEMINI_API_KEY not set. Returning placeholder response.');
        return `[AI response placeholder — set VITE_GEMINI_API_KEY in .env]\n\nPrompt received: "${prompt}"`;
    }

    const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const json: GeminiResponse = await response.json();
    return json.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ── Domain-specific AI helpers ────────────────────────────────────────────────

export const aiService = {
    /**
     * Generate lesson content / teaching materials for a given topic.
     * Used in TeacherDashboard's AI teaching flow.
     */
    generateLessonContent: async (
        subject: string,
        topic: string,
        gradeLevel: string,
    ): Promise<string> => {
        const prompt =
            `You are an expert educator. Create a comprehensive lesson plan for:\n` +
            `Subject: ${subject}\nTopic: ${topic}\nGrade: ${gradeLevel}\n\n` +
            `Include: learning objectives, key concepts, activities, and assessment ideas.`;
        return callGemini(prompt);
    },

    /**
     * Generate quiz questions for a topic.
     */
    generateQuiz: async (
        subject: string,
        topic: string,
        numberOfQuestions: number = 5,
    ): Promise<string> => {
        const prompt =
            `Create ${numberOfQuestions} multiple-choice quiz questions for:\n` +
            `Subject: ${subject}\nTopic: ${topic}\n\n` +
            `Format each question with 4 options (A-D) and indicate the correct answer.`;
        return callGemini(prompt);
    },

    /**
     * Summarize a student's performance based on grades and attendance data.
     */
    summarizeStudentPerformance: async (
        studentName: string,
        attendancePercentage: number,
        averageGrade: number,
        subjects: string[],
    ): Promise<string> => {
        const prompt =
            `Provide a brief, constructive performance summary for a student:\n` +
            `Name: ${studentName}\n` +
            `Attendance: ${attendancePercentage}%\n` +
            `Average Grade: ${averageGrade}%\n` +
            `Subjects: ${subjects.join(', ')}\n\n` +
            `Give actionable recommendations for improvement in 3-4 sentences.`;
        return callGemini(prompt);
    },

    /**
     * Generate a parent communication message about a student.
     */
    generateParentMessage: async (
        studentName: string,
        topic: string,
        context: string,
    ): Promise<string> => {
        const prompt =
            `Write a professional, empathetic message from a school to a parent about:\n` +
            `Student: ${studentName}\nRegarding: ${topic}\nContext: ${context}\n\n` +
            `Keep it concise (2-3 paragraphs), professional, and solution-focused.`;
        return callGemini(prompt);
    },

    /**
     * Generic prompt — for any custom AI use case.
     */
    prompt: async (text: string): Promise<string> => {
        return callGemini(text);
    },
};
