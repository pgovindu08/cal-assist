import { Router } from 'express';
import { sendMessage, getHistory, clearHistory, confirmEvent } from '../controllers/chat.controller';
import { authenticate } from '../middleware/authenticate';
import { chatRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.use(authenticate);

router.post('/message', chatRateLimiter, sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.post('/confirm/:messageId', confirmEvent);

export default router;
