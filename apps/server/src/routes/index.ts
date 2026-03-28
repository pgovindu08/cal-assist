import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import calendarRoutes from './calendar.routes';
import eventsRoutes from './events.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/calendar', calendarRoutes);
router.use('/events', eventsRoutes);

export default router;
