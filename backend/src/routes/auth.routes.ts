import { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getCurrentUser,
  logout,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/asyncHandler';

const router = Router();

// GET /api/auth/google
router.get('/google', asyncHandler(getGoogleAuthUrl));

// GET /api/auth/google/callback
router.get('/google/callback', asyncHandler(handleGoogleCallback));

// GET /api/auth/me
router.get('/me', requireAuth, asyncHandler(getCurrentUser));

// POST /api/auth/logout
router.post('/logout', asyncHandler(logout));

export default router;
