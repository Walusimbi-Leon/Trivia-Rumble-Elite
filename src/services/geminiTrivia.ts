import { GoogleGenAI, Type } from '@google/genai';

export interface TriviaQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

const DEFAULT_KEY = '';
const API_KEY = process.env.GEMINI_API_KEY || '';

// Available models on Free Tier
const CANDIDATE_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
];

const CATEGORIES = [
  'Gaming & Esports',
  'Science & Technology',
  'Movies, Cinema & TV',
  'World History & Civilizations',
  'Geography, Cities & Landmarks',
  'Pop Culture & Modern Music',
  'Anime, Manga & Comics',
  'Sports & Athletics',
  'Nature, Space & Wildlife',
  'Literature, Mythology & Art',
];

const ai = new GoogleGenAI({
  apiKey: API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

async function callGemini(prompt: string, modelName: string): Promise<TriviaQuestion[]> {
  const response = await ai.models.generateContent({
    model: modelName,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: {
              type: Type.STRING,
              description: 'The trivia question text',
            },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Exactly 4 multiple choice options',
            },
            correctAnswer: {
              type: Type.INTEGER,
              description: 'Index of correct option (0, 1, 2, or 3)',
            },
            category: {
              type: Type.STRING,
              description: 'Category name',
            },
          },
          required: ['question', 'options', 'correctAnswer', 'category'],
        },
      },
    },
  });

  const rawText = response.text || '[]';
  const parsed = JSON.parse(rawText);

  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array of trivia questions');
  }

  return parsed
    .filter((q: any) => {
      return (
        q &&
        typeof q.question === 'string' &&
        q.question.trim().length > 5 &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        q.options.every((opt: any) => typeof opt === 'string' && opt.trim().length > 0) &&
        typeof q.correctAnswer === 'number' &&
        q.correctAnswer >= 0 &&
        q.correctAnswer <= 3
      );
    })
    .map((q: any) => ({
      question: q.question.trim(),
      options: q.options.map((opt: string) => opt.trim()),
      correctAnswer: Math.floor(q.correctAnswer),
      category: typeof q.category === 'string' ? q.category.trim() : 'General',
    }));
}

/**
 * Generates a batch of unique, high-quality trivia questions using Gemini on the free tier.
 * Retries across candidate models with exponential backoff on temporary 503 spikes.
 */
export async function generateTriviaBatch(
  count: number = 25,
  categoryIndex: number = 0,
  existingTitles?: Set<string>
): Promise<TriviaQuestion[]> {
  const targetCategory = CATEGORIES[categoryIndex % CATEGORIES.length];
  const prompt = `You are a professional esports trivia game designer.
Generate ${count} completely unique, engaging, and accurate multiple-choice trivia questions focused primarily on: "${targetCategory}" (along with occasional general knowledge).

Requirements:
1. Every question must be fun, clear, unambiguous, and factually correct.
2. Provide exactly 4 plausible, distinct options.
3. Mark the zero-based index (0, 1, 2, or 3) of the correct answer in "correctAnswer".
4. Assign a clean category label in "category".
5. Do NOT repeat classic cliches. Create fresh, interesting trivia that players enjoy.

Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "question": "string",
    "options": ["string", "string", "string", "string"],
    "correctAnswer": 0,
    "category": "${targetCategory}"
  }
]`;

  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const questions = await callGemini(prompt, model);
        if (questions && questions.length > 0) {
          // Deduplicate against existing questions in bank
          if (existingTitles && existingTitles.size > 0) {
            return questions.filter((q) => {
              const normalized = q.question.toLowerCase().replace(/[^a-z0-9]/g, '');
              return !existingTitles.has(normalized);
            });
          }
          return questions;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[GeminiTrivia] Model ${model} attempt ${attempt + 1} failed: ${err.message || err}`);
        // Pause 2s on failure before next attempt/model
        await new Promise((r) => setTimeout(r, 2000));
      }
    }
  }

  throw lastError || new Error('Failed to generate trivia questions across all Gemini free tier models');
}
