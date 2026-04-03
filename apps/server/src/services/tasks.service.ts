import { prisma } from '../config/prisma';
import { AppError } from '../middleware/errorHandler';
import { TaskPriority, TaskStatus } from '@prisma/client';
import { google } from 'googleapis';
import { decrypt } from '../utils/encryption';

export interface CreateTaskInput {
  title: string;
  notes?: string;
  dueDate?: Date;
  priority?: TaskPriority;
  status?: TaskStatus;
  recurrence?: string;
  linkedEventId?: string;
}

export interface UpdateTaskInput extends Partial<CreateTaskInput> {}

// ─── CRUD ────────────────────────────────────────────────────────────────────

export async function createTask(userId: string, input: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      notes: input.notes,
      dueDate: input.dueDate,
      priority: input.priority ?? 'MEDIUM',
      status: input.status ?? 'TODO',
      recurrence: input.recurrence,
      linkedEventId: input.linkedEventId,
    },
  });

  // Fire-and-forget Google Tasks sync
  syncToGoogleTasks(userId, task.id, {
    title: task.title,
    notes: task.notes ?? undefined,
    dueDate: task.dueDate ?? undefined,
  });

  return task;
}

export async function listTasks(userId: string, filter?: { status?: TaskStatus; dueStart?: Date; dueEnd?: Date }) {
  const where: {
    userId: string;
    status?: TaskStatus;
    dueDate?: { gte?: Date; lte?: Date };
  } = { userId };

  if (filter?.status) {
    where.status = filter.status;
  }
  if (filter?.dueStart || filter?.dueEnd) {
    where.dueDate = {
      ...(filter.dueStart && { gte: filter.dueStart }),
      ...(filter.dueEnd && { lte: filter.dueEnd }),
    };
  }

  return prisma.task.findMany({
    where,
    orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
  });
}

export async function getTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!task) throw new AppError('Task not found', 404, 'NOT_FOUND');
  return task;
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.dueDate !== undefined && { dueDate: input.dueDate }),
      ...(input.priority !== undefined && { priority: input.priority }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.recurrence !== undefined && { recurrence: input.recurrence }),
      ...(input.linkedEventId !== undefined && { linkedEventId: input.linkedEventId }),
    },
  });

  // Update Google Tasks if synced
  if (task.googleTaskId && task.googleTaskListId) {
    updateGoogleTask(userId, task.googleTaskListId, task.googleTaskId, {
      title: task.title,
      notes: task.notes ?? undefined,
      dueDate: task.dueDate ?? undefined,
      status: task.status,
    });
  }

  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({ where: { id: taskId, userId } });
  if (!existing) throw new AppError('Task not found', 404, 'NOT_FOUND');

  // Delete from Google Tasks if synced
  if (existing.googleTaskId && existing.googleTaskListId) {
    deleteGoogleTask(userId, existing.googleTaskListId, existing.googleTaskId);
  }

  await prisma.task.delete({ where: { id: taskId } });
}

// ─── Google Tasks sync helpers ────────────────────────────────────────────────

async function getGoogleTasksClient(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { googleAccessToken: true, googleRefreshToken: true, tokenExpiresAt: true },
  });

  if (!user?.googleAccessToken) return null;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  const accessToken = decrypt(user.googleAccessToken);
  const refreshToken = user.googleRefreshToken ? decrypt(user.googleRefreshToken) : undefined;

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: user.tokenExpiresAt?.getTime(),
  });

  return google.tasks({ version: 'v1', auth: oauth2Client });
}

async function getOrCreateDefaultTaskList(tasksClient: ReturnType<typeof google.tasks>): Promise<string> {
  const listsRes = await tasksClient.tasklists.list({ maxResults: 10 });
  const lists = listsRes.data.items ?? [];
  const defaultList = lists.find((l) => l.title === 'My Tasks') ?? lists[0];
  if (defaultList?.id) return defaultList.id;

  const created = await tasksClient.tasklists.insert({ requestBody: { title: 'My Tasks' } });
  return created.data.id!;
}

function syncToGoogleTasks(
  userId: string,
  localTaskId: string,
  payload: { title: string; notes?: string; dueDate?: Date }
): void {
  getGoogleTasksClient(userId)
    .then(async (client) => {
      if (!client) return;

      const taskListId = await getOrCreateDefaultTaskList(client);

      const created = await client.tasks.insert({
        tasklist: taskListId,
        requestBody: {
          title: payload.title,
          notes: payload.notes,
          due: payload.dueDate ? payload.dueDate.toISOString() : undefined,
        },
      });

      if (created.data.id) {
        await prisma.task.update({
          where: { id: localTaskId },
          data: { googleTaskId: created.data.id, googleTaskListId: taskListId },
        });
      }
    })
    .catch((err: unknown) => {
      console.error('[Google Tasks sync] Failed for task', localTaskId, (err as Error)?.message);
    });
}

function updateGoogleTask(
  userId: string,
  taskListId: string,
  googleTaskId: string,
  payload: { title: string; notes?: string; dueDate?: Date; status: TaskStatus }
): void {
  getGoogleTasksClient(userId)
    .then(async (client) => {
      if (!client) return;
      await client.tasks.patch({
        tasklist: taskListId,
        task: googleTaskId,
        requestBody: {
          title: payload.title,
          notes: payload.notes,
          due: payload.dueDate ? payload.dueDate.toISOString() : undefined,
          status: payload.status === 'DONE' ? 'completed' : 'needsAction',
        },
      });
    })
    .catch((err: unknown) => {
      console.error('[Google Tasks update] Failed for task', googleTaskId, (err as Error)?.message);
    });
}

function deleteGoogleTask(userId: string, taskListId: string, googleTaskId: string): void {
  getGoogleTasksClient(userId)
    .then(async (client) => {
      if (!client) return;
      await client.tasks.delete({ tasklist: taskListId, task: googleTaskId });
    })
    .catch((err: unknown) => {
      console.error('[Google Tasks delete] Failed for task', googleTaskId, (err as Error)?.message);
    });
}
