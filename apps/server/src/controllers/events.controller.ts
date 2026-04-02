import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as eventsService from '../services/events.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const createEventSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  location: z.string().max(500).optional(),
  startDateTime: z.string().datetime(),
  endDateTime: z.string().datetime(),
  allDay: z.boolean().default(false),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#1A56DB'),
  recurrence: z.string().optional(),
});

const updateEventSchema = createEventSchema.partial();

const listEventsSchema = z.object({
  start: z.string().datetime().optional(),
  end: z.string().datetime().optional(),
});

export async function listEvents(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const query = listEventsSchema.safeParse(req.query);

    const start = query.success && query.data.start
      ? new Date(query.data.start)
      : new Date(new Date().setDate(1)); // start of current month

    const end = query.success && query.data.end
      ? new Date(query.data.end)
      : new Date(new Date(start).setMonth(start.getMonth() + 1));

    const events = await eventsService.listEvents(user.id, start, end);
    sendSuccess(res, { events });
  } catch (err) {
    next(err);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = createEventSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, input.error.errors[0]?.message ?? 'Invalid event data', 400, 'VALIDATION_ERROR');
      return;
    }

    const event = await eventsService.createEvent(user.id, {
      ...input.data,
      startDateTime: new Date(input.data.startDateTime),
      endDateTime: new Date(input.data.endDateTime),
    });

    sendSuccess(res, { event }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const event = await eventsService.getEvent(user.id, req.params.id);
    sendSuccess(res, { event });
  } catch (err) {
    next(err);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = updateEventSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, input.error.errors[0]?.message ?? 'Invalid event data', 400, 'VALIDATION_ERROR');
      return;
    }

    const { startDateTime, endDateTime, ...rest } = input.data;
    const updated = await eventsService.updateEvent(user.id, req.params.id, {
      ...rest,
      ...(startDateTime && { startDateTime: new Date(startDateTime) }),
      ...(endDateTime && { endDateTime: new Date(endDateTime) }),
    });

    sendSuccess(res, { event: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    await eventsService.deleteEvent(user.id, req.params.id);
    sendSuccess(res, { message: 'Event deleted' });
  } catch (err) {
    next(err);
  }
}
