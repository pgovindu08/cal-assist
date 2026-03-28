import { Router } from 'express';
import { listEvents, createEvent, getEvent, updateEvent, deleteEvent } from '../controllers/events.controller';
import { authenticate } from '../middleware/authenticate';

const router = Router();

router.use(authenticate);

router.get('/', listEvents);
router.post('/', createEvent);
router.get('/:id', getEvent);
router.patch('/:id', updateEvent);
router.delete('/:id', deleteEvent);

export default router;
