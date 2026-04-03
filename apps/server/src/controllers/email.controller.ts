import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as emailService from '../services/email.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import type { AuthenticatedRequest } from '../middleware/authenticate';

export async function getInbox(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const maxResults = Math.min(Number(req.query.max) || 40, 100);
    const emails = await emailService.listUnreadEmails(user.id, maxResults);
    sendSuccess(res, { emails });
  } catch (err) {
    next(err);
  }
}

export async function summarize(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const emails = await emailService.listUnreadEmails(user.id, 40);
    const summarized = await emailService.summarizeEmails(emails);
    sendSuccess(res, { emails: summarized });
  } catch (err) {
    next(err);
  }
}

const idSchema = z.object({ id: z.string().min(1) });

export async function trash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const parsed = idSchema.safeParse(req.params);
    if (!parsed.success) { sendError(res, 'Invalid message id', 400); return; }
    await emailService.trashEmail(user.id, parsed.data.id);
    sendSuccess(res, { message: 'Moved to trash' });
  } catch (err) {
    next(err);
  }
}

export async function untrash(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const parsed = idSchema.safeParse(req.params);
    if (!parsed.success) { sendError(res, 'Invalid message id', 400); return; }
    await emailService.untrashEmail(user.id, parsed.data.id);
    sendSuccess(res, { message: 'Restored from trash' });
  } catch (err) {
    next(err);
  }
}

export async function archive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const parsed = idSchema.safeParse(req.params);
    if (!parsed.success) { sendError(res, 'Invalid message id', 400); return; }
    await emailService.archiveEmail(user.id, parsed.data.id);
    sendSuccess(res, { message: 'Archived' });
  } catch (err) {
    next(err);
  }
}

export async function batchDelete(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const parsed = z.object({ ids: z.array(z.string().min(1)).min(1) }).safeParse(req.body);
    if (!parsed.success) { sendError(res, 'ids array required', 400); return; }
    await emailService.batchTrash(user.id, parsed.data.ids);
    sendSuccess(res, { message: `Moved ${parsed.data.ids.length} emails to trash` });
  } catch (err) {
    next(err);
  }
}

export async function markRead(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = (req as AuthenticatedRequest).user;
    const parsed = idSchema.safeParse(req.params);
    if (!parsed.success) { sendError(res, 'Invalid message id', 400); return; }
    await emailService.markAsRead(user.id, parsed.data.id);
    sendSuccess(res, { message: 'Marked as read' });
  } catch (err) {
    next(err);
  }
}
