import { groq, GROQ_MODEL } from '../config/groq';
import { AppError } from '../middleware/errorHandler';
import { z } from 'zod';

const SYSTEM_PROMPT_TEMPLATE = `You are CalAssist, a precise and friendly personal calendar assistant.

CURRENT CONTEXT:
- Current local date and time for the user: {CURRENT_LOCAL_DATETIME} (already in the user's timezone)
- User's timezone: {USER_TIMEZONE} (UTC offset: {UTC_OFFSET})
- User's name: {USER_NAME}

YOUR CAPABILITIES:
- Create calendar events (intent: CREATE_EVENT)
- List/query upcoming events (intent: LIST_EVENTS)
- Update existing events (intent: UPDATE_EVENT)
- Delete events (intent: DELETE_EVENT)
- Create tasks/to-dos (intent: CREATE_TASK)
- List tasks (intent: LIST_TASKS)
- Update tasks (intent: UPDATE_TASK)
- Delete tasks (intent: DELETE_TASK)
- Answer general questions (intent: GENERAL_QUESTION)

BEHAVIOR RULES:
1. All times the user mentions (e.g. "7pm", "3:30am") are in the user's local timezone ({USER_TIMEZONE}).
2. Always resolve relative dates ("tomorrow", "next Friday", "in 3 hours") using the CURRENT LOCAL DATE AND TIME shown above.
3. Output all datetimes as ISO 8601 strings with the user's UTC offset. Example for UTC-5: "2026-04-01T19:00:00-05:00". Do NOT convert to UTC.
4. If an event duration is not specified, default to 1 hour.
5. If an event time is ambiguous, set needsClarification: true.
6. For list requests without a date range, default to the next 7 days from today.
7. Keep the reply field conversational and brief (1-3 sentences).
8. Never invent attendee email addresses. Only include emails explicitly stated by the user.
9. If confidence is below 0.7, set needsClarification: true.
10. For GENERAL_QUESTION intent, do not populate the event or task fields.
11. Always respond in the same language the user writes in.
12. For UPDATE_EVENT and DELETE_EVENT, populate targetEventId if the user refers to a known event ID.
13. For UPDATE_TASK and DELETE_TASK, populate targetTaskId if the user refers to a known task ID.
14. Keywords like "task", "todo", "remind me to", "don't forget to", "to-do" suggest task intents. Keywords like "meeting", "appointment", "event", "schedule", "book" suggest calendar event intents.
15. For tasks: priority defaults to MEDIUM. Use HIGH for urgent/important/ASAP, LOW for someday/whenever.
16. For task due dates, output as an ISO 8601 datetime string. If no time is mentioned, use end of day (23:59:59).

You must return valid JSON only — no markdown, no code fences, no explanation. Example for a CREATE_TASK in UTC-5:
{"intent":"CREATE_TASK","reply":"Got it! Added 'Buy groceries' to your tasks.","confidence":0.97,"event":null,"task":{"title":"Buy groceries","notes":null,"dueDate":"2026-04-03T23:59:59-05:00","priority":"MEDIUM","status":"TODO","recurrence":null},"queryRange":null,"needsClarification":false,"clarificationQuestion":null,"targetEventId":null,"targetTaskId":null}

Example for a CREATE_EVENT in UTC-5:
{"intent":"CREATE_EVENT","reply":"Done! Added your dentist appointment for Friday at 2pm.","confidence":0.97,"event":{"title":"Dentist appointment","description":null,"location":null,"startDateTime":"2026-04-03T14:00:00-05:00","endDateTime":"2026-04-03T15:00:00-05:00","attendees":null,"allDay":false,"recurrence":null},"task":null,"queryRange":null,"needsClarification":false,"clarificationQuestion":null,"targetEventId":null,"targetTaskId":null}`;

const responseSchema = z.object({
  intent: z.enum(['CREATE_EVENT', 'LIST_EVENTS', 'UPDATE_EVENT', 'DELETE_EVENT', 'CREATE_TASK', 'LIST_TASKS', 'UPDATE_TASK', 'DELETE_TASK', 'GENERAL_QUESTION', 'NONE']),
  reply: z.string(),
  confidence: z.number().min(0).max(1),
  event: z.object({
    title: z.string(),
    description: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    startDateTime: z.string(),
    endDateTime: z.string(),
    attendees: z.array(z.string()).nullable().optional(),
    allDay: z.boolean(),
    recurrence: z.string().nullable().optional(),
  }).nullable().optional(),
  task: z.object({
    title: z.string(),
    notes: z.string().nullable().optional(),
    dueDate: z.string().nullable().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
    recurrence: z.string().nullable().optional(),
  }).nullable().optional(),
  queryRange: z.object({ start: z.string(), end: z.string() }).nullable().optional(),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().nullable().optional(),
  targetEventId: z.string().nullable().optional(),
  targetTaskId: z.string().nullable().optional(),
});

export type AIIntent =
  | 'CREATE_EVENT'
  | 'LIST_EVENTS'
  | 'UPDATE_EVENT'
  | 'DELETE_EVENT'
  | 'CREATE_TASK'
  | 'LIST_TASKS'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'GENERAL_QUESTION'
  | 'NONE';

export interface AIEventPayload {
  title: string;
  description?: string | null;
  location?: string | null;
  startDateTime: string;
  endDateTime: string;
  attendees?: string[] | null;
  allDay: boolean;
  recurrence?: string | null;
}

export interface AITaskPayload {
  title: string;
  notes?: string | null;
  dueDate?: string | null;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  status?: 'TODO' | 'IN_PROGRESS' | 'DONE';
  recurrence?: string | null;
}

export interface AIResponse {
  intent: AIIntent;
  reply: string;
  confidence: number;
  event?: AIEventPayload | null;
  task?: AITaskPayload | null;
  queryRange?: { start: string; end: string } | null;
  needsClarification: boolean;
  clarificationQuestion?: string | null;
  targetEventId?: string | null;
  targetTaskId?: string | null;
}

interface HistoryMessage {
  role: 'USER' | 'ASSISTANT';
  content: string;
}

interface PromptContext {
  timezone: string;
  userName: string;
}

function getLocalDatetime(timezone: string): { localDatetime: string; utcOffset: string } {
  const now = new Date();

  // Format current time in the user's local timezone (e.g. "2026-03-31 19:00:00")
  const localDatetime = now.toLocaleString('sv-SE', { timeZone: timezone }).replace('T', ' ');

  // Extract UTC offset from Intl (e.g. "GMT-5" → "-05:00")
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  }).formatToParts(now);

  const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT';
  // tzPart examples: "GMT", "GMT-5", "GMT+5:30"
  const raw = tzPart.replace('GMT', '') || '+0';
  const [hourStr, minStr = '00'] = raw.split(':');
  const sign = hourStr.startsWith('-') ? '-' : '+';
  const hour = Math.abs(parseInt(hourStr, 10)).toString().padStart(2, '0');
  const min = minStr.padStart(2, '0');
  const utcOffset = `${sign}${hour}:${min}`;

  return { localDatetime, utcOffset };
}

export async function extractIntent(
  userMessage: string,
  history: HistoryMessage[],
  context: PromptContext
): Promise<AIResponse> {
  const { localDatetime, utcOffset } = getLocalDatetime(context.timezone);

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace('{CURRENT_LOCAL_DATETIME}', localDatetime)
    .replace('{USER_TIMEZONE}', context.timezone)
    .replace('{UTC_OFFSET}', utcOffset)
    .replace('{USER_TIMEZONE}', context.timezone) // second occurrence in example
    .replace('{USER_NAME}', context.userName);

  const messages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: (m.role === 'USER' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: userMessage },
  ];

  try {
    const completion = await groq.chat.completions.create({
      model: GROQ_MODEL,
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 1024,
    });

    const rawText = completion.choices[0]?.message?.content ?? '';

    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      console.error('Failed to parse AI response:', rawText);
      throw new AppError('AI returned an unexpected format. Please try again.', 500, 'AI_PARSE_ERROR');
    }

    const validated = responseSchema.safeParse(parsed);
    if (!validated.success) {
      console.error('AI response validation failed:', validated.error.flatten());
      throw new AppError('AI returned an unexpected format. Please try again.', 500, 'AI_VALIDATION_ERROR');
    }

    return validated.data as AIResponse;
  } catch (err) {
    if (err instanceof AppError) throw err;

    const error = err as Error & { status?: number };
    console.error('AI service error:', error.message);

    if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate')) {
      throw new AppError('Too many requests. Please wait a moment and try again.', 429, 'RATE_LIMIT');
    }
    if (error.status === 401 || error.message?.includes('401') || error.message?.includes('API key')) {
      throw new AppError('Invalid AI API key. Please check your GROQ_API_KEY in .env.', 503, 'AUTH_ERROR');
    }

    throw new AppError(`AI error: ${error.message ?? 'Unknown error'}`, 503, 'AI_UNAVAILABLE');
  }
}
