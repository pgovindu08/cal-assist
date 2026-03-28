import { genAI } from '../config/gemini';
import type { GeminiResponse } from '../types/gemini.types';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const SYSTEM_PROMPT_TEMPLATE = `You are CalAssist, a precise and friendly personal calendar assistant.

CURRENT CONTEXT:
- Today's date and time: {CURRENT_DATETIME} (ISO 8601 with timezone)
- User's timezone: {USER_TIMEZONE}
- User's name: {USER_NAME}

YOUR CAPABILITIES:
- Create calendar events (intent: CREATE_EVENT)
- List/query upcoming events (intent: LIST_EVENTS)
- Update existing events (intent: UPDATE_EVENT)
- Delete events (intent: DELETE_EVENT)
- Answer general questions (intent: GENERAL_QUESTION)

BEHAVIOR RULES:
1. Always resolve relative dates ("tomorrow", "next Friday", "in 3 hours") to absolute ISO 8601 datetimes using CURRENT CONTEXT. Never return relative dates.
2. If an event duration is not specified, default to 1 hour.
3. If an event time is ambiguous, set needsClarification: true.
4. For list requests without a date range, default to the next 7 days from today.
5. Keep the reply field conversational and brief (1-3 sentences).
6. Never invent attendee email addresses. Only include emails explicitly stated by the user.
7. If confidence is below 0.7, set needsClarification: true.
8. For GENERAL_QUESTION intent, do not populate the event field.
9. Always respond in the same language the user writes in.
10. For UPDATE_EVENT and DELETE_EVENT, populate targetEventId if the user refers to a known event ID.

You must return valid JSON matching exactly this structure (no markdown, no code fences, raw JSON only):
{
  "intent": "CREATE_EVENT",
  "reply": "string",
  "confidence": 0.95,
  "event": { "title": "string", "description": null, "location": null, "startDateTime": "2026-03-28T10:00:00Z", "endDateTime": "2026-03-28T11:00:00Z", "attendees": null, "allDay": false, "recurrence": null },
  "queryRange": null,
  "needsClarification": false,
  "clarificationQuestion": null,
  "targetEventId": null
}`;

const geminiResponseSchema = z.object({
  intent: z.enum([
    'CREATE_EVENT',
    'LIST_EVENTS',
    'UPDATE_EVENT',
    'DELETE_EVENT',
    'GENERAL_QUESTION',
    'NONE',
  ]),
  reply: z.string(),
  confidence: z.number().min(0).max(1),
  event: z
    .object({
      title: z.string(),
      description: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      startDateTime: z.string(),
      endDateTime: z.string(),
      attendees: z.array(z.string()).nullable().optional(),
      allDay: z.boolean(),
      recurrence: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
  queryRange: z
    .object({ start: z.string(), end: z.string() })
    .nullable()
    .optional(),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable().optional(),
  targetEventId: z.string().nullable().optional(),
});

interface HistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

interface PromptContext {
  timezone: string;
  userName: string;
}

export async function extractIntent(
  userMessage: string,
  history: HistoryMessage[],
  context: PromptContext
): Promise<GeminiResponse> {
  const currentDatetime = new Date().toISOString();

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{CURRENT_DATETIME}', currentDatetime)
    .replace('{USER_TIMEZONE}', context.timezone)
    .replace('{USER_NAME}', context.userName);

  // Build contents array: system prompt + history + new user message
  const contents = [
    ...history.slice(-10).map((m) => ({
      role: m.role === 'USER' ? 'user' : 'model',
      parts: [{ text: m.content }],
    })),
    { role: 'user', parts: [{ text: userMessage }] },
  ];

  try {
    // Get a fresh model instance per request so generationConfig is applied correctly
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: systemPrompt,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const result = await model.generateContent({ contents });
    const rawText = result.response.text();

    // Strip markdown code fences if model wraps response anyway
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error('Gemini raw response (parse failed):', rawText);
      throw new AppError('AI returned an unexpected response format. Please try again.', 500, 'GEMINI_PARSE_ERROR');
    }

    const validated = geminiResponseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('Gemini validation failed:', validated.error.flatten(), 'Parsed:', parsed);
      throw new AppError('AI returned an unexpected response format. Please try again.', 500, 'GEMINI_VALIDATION_ERROR');
    }

    return validated.data as GeminiResponse;
  } catch (err) {
    if (err instanceof AppError) throw err;

    const error = err as Error & { status?: number; message?: string };
    console.error('Gemini API error:', error.message ?? error);

    if (error.status === 429 || error.message?.includes('429')) {
      throw new AppError("Too many requests. Please wait a moment and try again.", 429, 'GEMINI_RATE_LIMIT');
    }
    if (error.status === 403 || error.message?.includes('API_KEY') || error.message?.includes('403')) {
      throw new AppError("AI service configuration error. Please check the API key.", 503, 'GEMINI_AUTH_ERROR');
    }
    if (error.status === 404 || error.message?.includes('not found') || error.message?.includes('404')) {
      throw new AppError("AI model not available. Please contact support.", 503, 'GEMINI_MODEL_ERROR');
    }

    throw new AppError(`AI service error: ${error.message ?? 'Unknown error'}`, 503, 'GEMINI_UNAVAILABLE');
  }
}
