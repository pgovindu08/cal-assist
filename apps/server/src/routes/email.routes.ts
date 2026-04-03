import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { chatRateLimiter } from '../middleware/rateLimiter';
import {
  getInbox, summarize, trash, untrash, archive, batchDelete, markRead,
} from '../controllers/email.controller';

const router = Router();

router.use(authenticate);

router.get('/inbox',                     getInbox);
router.post('/summarize', chatRateLimiter, summarize);
router.post('/trash/:id',                trash);
router.post('/untrash/:id',              untrash);
router.post('/archive/:id',              archive);
router.post('/batch-trash',              batchDelete);
router.post('/mark-read/:id',            markRead);

export default router;
