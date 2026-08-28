import { Request, Response } from 'express';
import { emailService } from '../services/email.service';
import { csvParserService } from '../services/csv-parser.service';
import { AppError } from '../types';

export async function scheduleEmails(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const result = await emailService.scheduleEmails({
    ...req.body,
    userId,
  });
  res.status(201).json({
    success: true,
    data: result,
  });
}

export async function getScheduledEmails(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  const result = await emailService.getScheduledEmails({ userId, page, limit });
  res.json({
    success: true,
    data: result,
  });
}

export async function getSentEmails(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

  const result = await emailService.getSentEmails({ userId, page, limit });
  res.json({
    success: true,
    data: result,
  });
}

export async function getEmailById(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const userId = (req as any).user?.id;

  const email = await emailService.getEmailById(id, userId);
  res.json({
    success: true,
    data: email,
  });
}

export async function searchEmails(req: Request, res: Response): Promise<void> {
  const query = (req.query.q as string) || '';
  const userId = (req as any).user?.id;

  const result = await emailService.searchEmails(query, userId);
  res.json({
    success: true,
    data: result,
  });
}

export async function uploadRecipients(req: Request, res: Response): Promise<void> {
  if (!req.file && !req.body.text) {
    throw new AppError('Please provide a CSV file or raw text containing email addresses', 400);
  }

  const content = req.file ? req.file.buffer.toString('utf-8') : req.body.text;
  const result = csvParserService.parseEmailsFromContent(content);

  res.json({
    success: true,
    data: result,
  });
}
