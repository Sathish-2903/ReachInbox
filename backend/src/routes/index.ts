import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import emailRoutes from './email.routes';
import slackRoutes from './slack.routes';
import { optionalAuth } from '../middleware/auth.middleware';

const router = Router();

// Apply optionalAuth across API routes to automatically populate req.user if token is present
router.use(optionalAuth);

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/emails', emailRoutes);
router.use('/slack', slackRoutes);

export default router;
