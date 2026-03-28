import { Router } from 'express';
import { listEvents, createEvent, getEvent } from '../controllers/calendar.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/events', listEvents);
router.post('/events', createEvent);
router.get('/events/:googleEventId', getEvent);

export default router;
