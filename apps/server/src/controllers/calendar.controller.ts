import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as calendarService from '../services/calendar.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const listEventsSchema = z.object({
  start: z.string(),
  end: z.string(),
});

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const query = listEventsSchema.safeParse(req.query);

    if (!query.success) {
      // Default to next 7 days
      const start = new Date().toISOString();
      const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const events = await calendarService.listEvents(user.id, start, end);
      sendSuccess(res, { events });
      return;
    }

    const events = await calendarService.listEvents(user.id, query.data.start, query.data.end);
    sendSuccess(res, { events });
  } catch (err) {
    next(err);
  }
}

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  location: z.string().optional(),
  startDateTime: z.string(),
  endDateTime: z.string(),
  attendees: z.array(z.string().email()).optional(),
  allDay: z.boolean().default(false),
  recurrence: z.string().nullable().optional(),
});

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = createEventSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, 'Invalid event data', 400, 'VALIDATION_ERROR');
      return;
    }

    const event = await calendarService.createEvent(user.id, input.data);
    sendSuccess(res, { event }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { googleEventId } = req.params;
    const event = await calendarService.getEvent(user.id, googleEventId);
    sendSuccess(res, { event });
  } catch (err) {
    next(err);
  }
}
