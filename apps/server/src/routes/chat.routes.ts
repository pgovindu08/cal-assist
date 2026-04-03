import { Router } from 'express';
import multer from 'multer';
import { sendMessage, getHistory, clearHistory, confirmEvent, transcribeAudio } from '../controllers/chat.controller';
import { authenticate } from '../middleware/authenticate';
import { chatRateLimiter } from '../middleware/rateLimiter';

const router = Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB — Whisper's max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  },
});

router.use(authenticate);

router.post('/message', chatRateLimiter, sendMessage);
router.get('/history', getHistory);
router.delete('/history', clearHistory);
router.post('/confirm/:messageId', confirmEvent);
router.post('/transcribe', chatRateLimiter, audioUpload.single('audio'), transcribeAudio);

export default router;
