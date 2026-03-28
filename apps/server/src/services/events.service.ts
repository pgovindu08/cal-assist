import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';

export interface CreateEventInput {
  title: string;
  description?: string;
  location?: string;
  startDateTime: Date;
  endDateTime: Date;
  allDay?: boolean;
  color?: string;
  recurrence?: string;
}

export interface UpdateEventInput extends Partial<CreateEventInput> {}

export async function listEvents(userId: string, start: Date, end: Date) {
  return prisma.event.findMany({
    where: {
      userId,
      startDateTime: { gte: start },
      endDateTime: { lte: end },
    },
    orderBy: { startDateTime: 'asc' },
  });
}

export async function createEvent(userId: string, input: CreateEventInput) {
  if (input.endDateTime <= input.startDateTime) {
    throw new AppError('End time must be after start time', 400, 'INVALID_TIME_RANGE');
  }
  return prisma.event.create({
    data: {
      userId,
      title: input.title,
      description: input.description,
      location: input.location,
      startDateTime: input.startDateTime,
      endDateTime: input.endDateTime,
      allDay: input.allDay ?? false,
      color: input.color ?? '#1A56DB',
      recurrence: input.recurrence,
    },
  });
}

export async function getEvent(userId: string, eventId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, userId } });
  if (!event) throw new AppError('Event not found', 404, 'EVENT_NOT_FOUND');
  return event;
}

export async function updateEvent(userId: string, eventId: string, input: UpdateEventInput) {
  await getEvent(userId, eventId); // ensures ownership
  return prisma.event.update({
    where: { id: eventId },
    data: {
      ...(input.title && { title: input.title }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.location !== undefined && { location: input.location }),
      ...(input.startDateTime && { startDateTime: input.startDateTime }),
      ...(input.endDateTime && { endDateTime: input.endDateTime }),
      ...(input.allDay !== undefined && { allDay: input.allDay }),
      ...(input.color && { color: input.color }),
      ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
    },
  });
}

export async function deleteEvent(userId: string, eventId: string) {
  await getEvent(userId, eventId); // ensures ownership
  await prisma.event.delete({ where: { id: eventId } });
}

export async function searchEvents(userId: string, query: string) {
  return prisma.event.findMany({
    where: {
      userId,
      title: { contains: query, mode: 'insensitive' },
    },
    orderBy: { startDateTime: 'asc' },
    take: 20,
  });
}
