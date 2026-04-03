import { prisma } from '../config/prisma';
import { extractIntent } from './gemini.service';
import * as eventsService from './events.service';
import * as calendarService from './calendar.service';
import * as tasksService from './tasks.service';
import type { CalendarAction } from '@prisma/client';

const CONFIDENCE_THRESHOLD = 0.85;

export interface ChatResult {
  id: string;
  role: 'ASSISTANT';
  content: string;
  actionType: CalendarAction | null;
  actionPayload: Record<string, unknown> | null;
  eventId: string | null;
  taskId: string | null;
  events?: unknown[];
  tasks?: unknown[];
  requiresConfirmation?: boolean;
  createdAt: Date;
}

export async function processMessage(
  userId: string,
  userMessage: string,
  timezone: string,
  userName: string
): Promise<ChatResult> {
  // Save user message
  await prisma.message.create({
    data: { userId, role: 'USER', content: userMessage, actionType: null },
  });

  // Fetch recent history for Gemini context
  const recentMessages = await prisma.message.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 11,
    select: { role: true, content: true },
  });

  const history = recentMessages
    .reverse()
    .slice(0, -1)
    .map((m) => ({ role: m.role as 'USER' | 'ASSISTANT', content: m.content }));

  const geminiResult = await extractIntent(userMessage, history, { timezone, userName });

  let actionType: CalendarAction = 'NONE';
  let actionPayload: Record<string, unknown> | null = null;
  let eventId: string | null = null;
  let taskId: string | null = null;
  let events: unknown[] | undefined;
  let tasks: unknown[] | undefined;
  let requiresConfirmation = false;
  let replyContent = geminiResult.reply;

  if (geminiResult.needsClarification) {
    replyContent = geminiResult.clarificationQuestion ?? geminiResult.reply;

  } else if (geminiResult.intent === 'CREATE_EVENT' && geminiResult.event) {
    actionType = 'CREATE_EVENT';
    const e = geminiResult.event;
    actionPayload = {
      title: e.title,
      description: e.description ?? undefined,
      location: e.location ?? undefined,
      startDateTime: e.startDateTime,
      endDateTime: e.endDateTime,
      allDay: e.allDay,
      color: '#1A56DB',
      recurrence: e.recurrence ?? undefined,
    };

    if (geminiResult.confidence >= CONFIDENCE_THRESHOLD) {
      try {
        const created = await eventsService.createEvent(userId, {
          title: e.title,
          description: e.description ?? undefined,
          location: e.location ?? undefined,
          startDateTime: new Date(e.startDateTime),
          endDateTime: new Date(e.endDateTime),
          allDay: e.allDay,
          recurrence: e.recurrence ?? undefined,
        });
        eventId = created.id;

        // Sync to Google Calendar if the user signed in with Google
        syncToGoogleCalendar(userId, created.id, {
          title: e.title,
          description: e.description ?? undefined,
          location: e.location ?? undefined,
          startDateTime: e.startDateTime,
          endDateTime: e.endDateTime,
          allDay: e.allDay,
          attendees: e.attendees ?? undefined,
          recurrence: e.recurrence ?? undefined,
        });
      } catch {
        replyContent = "I understood what you want, but had trouble saving the event. Please try again.";
      }
    } else {
      requiresConfirmation = true;
    }

  } else if (geminiResult.intent === 'LIST_EVENTS') {
    actionType = 'LIST_EVENTS';
    const range = geminiResult.queryRange;
    if (range) {
      try {
        events = await eventsService.listEvents(
          userId,
          new Date(range.start),
          new Date(range.end)
        );
        if ((events as unknown[]).length === 0) {
          replyContent = geminiResult.reply || "You have no events scheduled for that period.";
        }
      } catch {
        replyContent = "I couldn't fetch your events right now. Please try again.";
      }
    }

  } else if (geminiResult.intent === 'UPDATE_EVENT' && geminiResult.event) {
    actionType = 'UPDATE_EVENT';
    const targetId = geminiResult.targetEventId;
    if (targetId) {
      const e = geminiResult.event;
      try {
        await eventsService.updateEvent(userId, targetId, {
          ...(e.title && { title: e.title }),
          ...(e.description !== undefined && { description: e.description ?? undefined }),
          ...(e.location !== undefined && { location: e.location ?? undefined }),
          startDateTime: new Date(e.startDateTime),
          endDateTime: new Date(e.endDateTime),
          allDay: e.allDay,
        });
        eventId = targetId;
      } catch {
        replyContent = "I couldn't update that event. Please try again.";
      }
    }

  } else if (geminiResult.intent === 'DELETE_EVENT') {
    actionType = 'DELETE_EVENT';
    const targetId = geminiResult.targetEventId;
    if (targetId) {
      try {
        await eventsService.deleteEvent(userId, targetId);
        eventId = targetId;
      } catch {
        replyContent = "I couldn't delete that event. Please try again.";
      }
    }

  } else if (geminiResult.intent === 'CREATE_TASK' && geminiResult.task) {
    actionType = 'CREATE_TASK';
    const t = geminiResult.task;
    actionPayload = {
      title: t.title,
      notes: t.notes ?? undefined,
      dueDate: t.dueDate ?? undefined,
      priority: t.priority ?? 'MEDIUM',
      status: t.status ?? 'TODO',
      recurrence: t.recurrence ?? undefined,
    };

    try {
      const created = await tasksService.createTask(userId, {
        title: t.title,
        notes: t.notes ?? undefined,
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        priority: (t.priority ?? 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        status: (t.status ?? 'TODO') as 'TODO' | 'IN_PROGRESS' | 'DONE',
        recurrence: t.recurrence ?? undefined,
      });
      taskId = created.id;
    } catch {
      replyContent = "I understood what you want, but had trouble saving the task. Please try again.";
    }

  } else if (geminiResult.intent === 'LIST_TASKS') {
    actionType = 'LIST_TASKS';
    try {
      const range = geminiResult.queryRange;
      tasks = await tasksService.listTasks(userId, {
        dueStart: range?.start ? new Date(range.start) : undefined,
        dueEnd: range?.end ? new Date(range.end) : undefined,
      });
      if ((tasks as unknown[]).length === 0) {
        replyContent = geminiResult.reply || "You have no tasks for that period.";
      }
    } catch {
      replyContent = "I couldn't fetch your tasks right now. Please try again.";
    }

  } else if (geminiResult.intent === 'UPDATE_TASK' && geminiResult.task) {
    actionType = 'UPDATE_TASK';
    const targetId = geminiResult.targetTaskId;
    if (targetId) {
      const t = geminiResult.task;
      try {
        const updated = await tasksService.updateTask(userId, targetId, {
          ...(t.title && { title: t.title }),
          ...(t.notes !== undefined && { notes: t.notes ?? undefined }),
          ...(t.dueDate !== undefined && { dueDate: t.dueDate ? new Date(t.dueDate) : undefined }),
          ...(t.priority && { priority: t.priority as 'LOW' | 'MEDIUM' | 'HIGH' }),
          ...(t.status && { status: t.status as 'TODO' | 'IN_PROGRESS' | 'DONE' }),
        });
        taskId = updated.id;
      } catch {
        replyContent = "I couldn't update that task. Please try again.";
      }
    }

  } else if (geminiResult.intent === 'DELETE_TASK') {
    actionType = 'DELETE_TASK';
    const targetId = geminiResult.targetTaskId;
    if (targetId) {
      try {
        await tasksService.deleteTask(userId, targetId);
        taskId = targetId;
      } catch {
        replyContent = "I couldn't delete that task. Please try again.";
      }
    }
  }

  const assistantMessage = await prisma.message.create({
    data: {
      userId,
      role: 'ASSISTANT',
      content: replyContent,
      actionType,
      actionPayload: actionPayload ? (actionPayload as object) : undefined,
      eventId,
    },
  });

  return {
    id: assistantMessage.id,
    role: 'ASSISTANT',
    content: replyContent,
    actionType,
    actionPayload,
    eventId,
    taskId,
    events,
    tasks,
    requiresConfirmation,
    createdAt: assistantMessage.createdAt,
  };
}

export async function confirmEventCreation(userId: string, messageId: string): Promise<ChatResult> {
  const message = await prisma.message.findFirst({
    where: { id: messageId, userId, actionType: 'CREATE_EVENT' },
  });

  if (!message?.actionPayload) {
    return {
      id: messageId,
      role: 'ASSISTANT',
      content: "I couldn't find the pending event to confirm.",
      actionType: null,
      actionPayload: null,
      eventId: null,
      taskId: null,
      createdAt: new Date(),
    };
  }

  const payload = message.actionPayload as Record<string, unknown>;
  let eventId: string | null = null;
  let content = `Done! "${payload.title}" has been added to your calendar.`;

  try {
    const created = await eventsService.createEvent(userId, {
      title: payload.title as string,
      description: payload.description as string | undefined,
      location: payload.location as string | undefined,
      startDateTime: new Date(payload.startDateTime as string),
      endDateTime: new Date(payload.endDateTime as string),
      allDay: (payload.allDay as boolean) ?? false,
      color: (payload.color as string) ?? '#1A56DB',
      recurrence: payload.recurrence as string | undefined,
    });
    eventId = created.id;

    // Sync to Google Calendar if the user signed in with Google
    syncToGoogleCalendar(userId, created.id, {
      title: payload.title as string,
      description: payload.description as string | undefined,
      location: payload.location as string | undefined,
      startDateTime: payload.startDateTime as string,
      endDateTime: payload.endDateTime as string,
      allDay: (payload.allDay as boolean) ?? false,
      recurrence: payload.recurrence as string | undefined,
    });
  } catch {
    content = "I had trouble creating the event. Please try again.";
  }

  if (eventId) {
    await prisma.message.update({ where: { id: messageId }, data: { eventId } });
  }

  return {
    id: `confirm-${messageId}`,
    role: 'ASSISTANT',
    content,
    actionType: 'CREATE_EVENT',
    actionPayload: payload,
    eventId,
    taskId: null,
    createdAt: new Date(),
  };
}

/**
 * Fire-and-forget: push a newly created local event to Google Calendar.
 * Only runs if the user has a connected Google account.
 * Failures are logged but never surface to the user.
 */
function syncToGoogleCalendar(
  userId: string,
  localEventId: string,
  payload: {
    title: string;
    description?: string;
    location?: string;
    startDateTime: string;
    endDateTime: string;
    allDay: boolean;
    attendees?: string[] | null;
    recurrence?: string | null;
  }
): void {
  prisma.user
    .findUnique({ where: { id: userId }, select: { googleAccessToken: true } })
    .then((user) => {
      if (!user?.googleAccessToken) return; // local-only account, skip

      return calendarService
        .createEvent(userId, {
          title: payload.title,
          description: payload.description,
          location: payload.location,
          startDateTime: payload.startDateTime,
          endDateTime: payload.endDateTime,
          allDay: payload.allDay,
          attendees: payload.attendees ?? undefined,
          recurrence: payload.recurrence ?? undefined,
        })
        .then((gcalEvent) =>
          prisma.event.update({
            where: { id: localEventId },
            data: { googleEventId: gcalEvent.googleEventId },
          })
        );
    })
    .catch((err: unknown) => {
      const e = err as Error & { response?: { data?: unknown } };
      console.error('[Google Calendar sync] Failed for event', localEventId, e?.message, e?.response?.data ?? '');
    });
}

export async function getChatHistory(userId: string, limit = 50, beforeId?: string) {
  const where = beforeId ? { userId, id: { lt: beforeId } } : { userId };
  const messages = await prisma.message.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
  });

  const hasMore = messages.length > limit;
  return { messages: messages.slice(0, limit).reverse(), hasMore };
}
