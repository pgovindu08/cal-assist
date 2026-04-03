import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as tasksService from '../services/tasks.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  notes: z.string().max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  recurrence: z.string().optional(),
  linkedEventId: z.string().optional(),
});

const updateTaskSchema = createTaskSchema.partial();

const listTasksSchema = z.object({
  status: z.enum(['TODO', 'IN_PROGRESS', 'DONE']).optional(),
  dueStart: z.string().datetime().optional(),
  dueEnd: z.string().datetime().optional(),
});

export async function listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const query = listTasksSchema.safeParse(req.query);

    const filter = query.success ? {
      status: query.data.status,
      dueStart: query.data.dueStart ? new Date(query.data.dueStart) : undefined,
      dueEnd: query.data.dueEnd ? new Date(query.data.dueEnd) : undefined,
    } : {};

    const tasks = await tasksService.listTasks(user.id, filter);
    sendSuccess(res, { tasks });
  } catch (err) {
    next(err);
  }
}

export async function createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = createTaskSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, input.error.errors[0]?.message ?? 'Invalid task data', 400, 'VALIDATION_ERROR');
      return;
    }

    const task = await tasksService.createTask(user.id, {
      ...input.data,
      dueDate: input.data.dueDate ? new Date(input.data.dueDate) : undefined,
    });

    sendSuccess(res, { task }, 201);
  } catch (err) {
    next(err);
  }
}

export async function getTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const task = await tasksService.getTask(user.id, req.params.id);
    sendSuccess(res, { task });
  } catch (err) {
    next(err);
  }
}

export async function updateTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = updateTaskSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, input.error.errors[0]?.message ?? 'Invalid task data', 400, 'VALIDATION_ERROR');
      return;
    }

    const { dueDate, ...rest } = input.data;
    const updated = await tasksService.updateTask(user.id, req.params.id, {
      ...rest,
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : undefined }),
    });

    sendSuccess(res, { task: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteTask(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    await tasksService.deleteTask(user.id, req.params.id);
    sendSuccess(res, { message: 'Task deleted' });
  } catch (err) {
    next(err);
  }
}
