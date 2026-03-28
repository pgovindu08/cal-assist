import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { processMessage, getChatHistory, confirmEventCreation } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { prisma } from '../config/prisma';
import type { AuthenticatedRequest } from '../middleware/authenticate';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(2000),
  timezone: z.string().default('UTC'),
});

export async function sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const input = sendMessageSchema.safeParse(req.body);

    if (!input.success) {
      sendError(res, 'Invalid request body', 400, 'VALIDATION_ERROR');
      return;
    }

    const result = await processMessage(
      user.id,
      input.data.content,
      input.data.timezone,
      user.name
    );

    sendSuccess(res, { message: result });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const beforeId = req.query.before as string | undefined;

    const { messages, hasMore } = await getChatHistory(user.id, limit, beforeId);
    sendSuccess(res, { messages, hasMore });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    await prisma.message.deleteMany({ where: { userId: user.id } });
    sendSuccess(res, { message: 'Chat history cleared' });
  } catch (err) {
    next(err);
  }
}

export async function confirmEvent(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const { messageId } = req.params;

    const result = await confirmEventCreation(user.id, messageId);
    sendSuccess(res, { message: result });
  } catch (err) {
    next(err);
  }
}
