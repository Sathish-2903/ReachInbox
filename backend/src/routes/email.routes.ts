import { Router } from 'express';
import multer from 'multer';
import {
  scheduleEmails,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
  searchEmails,
  uploadRecipients,
} from '../controllers/email.controller';
import { asyncHandler } from '../middleware/asyncHandler';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

const router = Router();

// POST /api/emails/schedule
router.post('/schedule', asyncHandler(scheduleEmails));

// POST /api/emails/upload (CSV or Text file upload)
router.post('/upload', upload.single('file'), asyncHandler(uploadRecipients));

// GET /api/emails/search?q=... (Must be placed before /:id)
router.get('/search', asyncHandler(searchEmails));

// GET /api/emails/scheduled
router.get('/scheduled', asyncHandler(getScheduledEmails));

// GET /api/emails/sent
router.get('/sent', asyncHandler(getSentEmails));

// GET /api/emails/:id
router.get('/:id', asyncHandler(getEmailById));

export default router;
