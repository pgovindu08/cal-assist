import { Router } from 'express';
import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import calendarRoutes from './calendar.routes';
import eventsRoutes from './events.routes';
import tasksRoutes from './tasks.routes';
import emailRoutes from './email.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/calendar', calendarRoutes);
router.use('/events', eventsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/email', emailRoutes);

export default router;
