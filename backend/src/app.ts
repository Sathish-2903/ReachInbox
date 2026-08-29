import './config/env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { config } from './config/env';
import apiRouter from './routes';
import { errorHandler } from './middleware/errorHandler';
import { AppError } from './types';
import { setupBullBoard } from './config/bullboard';
// Import workers so worker process starts automatically with backend
import './workers/email.worker';

const app = express();

// ─── Global Middleware ─────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Bull Board Queue Dashboard (Level 18) ─────────────────────────────────────
app.use('/admin/queues', setupBullBoard());

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
});

// ─── Centralized Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Server Startup ────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[server] ReachInbox backend running on http://localhost:${config.port}`);
    console.log(`[server] Health check: http://localhost:${config.port}/api/health`);
    console.log(`[server] BullMQ Dashboard: http://localhost:${config.port}/admin/queues`);
  });
}

export default app;
