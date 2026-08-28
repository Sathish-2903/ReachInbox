import { Router } from 'express';
import {
  getSlackAuthUrl,
  handleSlackCallback,
  getSlackStatus,
  disconnectSlack,
} from '../controllers/slack.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// GET /api/slack/auth
router.get('/auth', asyncHandler(getSlackAuthUrl));

// GET /api/slack/callback
router.get('/callback', asyncHandler(handleSlackCallback));

// GET /api/slack/status
router.get('/status', asyncHandler(getSlackStatus));

// POST /api/slack/disconnect
router.post('/disconnect', asyncHandler(disconnectSlack));

export default router;
