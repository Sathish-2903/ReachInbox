import { Request, Response } from 'express';
import { slackService } from '../services/slack.service';
import { config } from '../config/env';

export async function getSlackAuthUrl(req: Request, res: Response): Promise<void> {
  const url = slackService.getAuthorizationUrl();
  res.json({ success: true, url });
}

export async function handleSlackCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ success: false, error: 'Authorization code is required' });
    return;
  }

  const tokenData = await slackService.exchangeCodeForToken(code);
  
  // If user is authenticated, associate token; otherwise associate with active/first user or log
  const userId = (req as any).user?.id;
  if (userId && tokenData.access_token) {
    await slackService.saveUserSlackToken(userId, tokenData.access_token);
  }

  // Redirect to frontend with success query param or return JSON
  res.redirect(`${config.frontendUrl}/?slack_connected=true`);
}

export async function getSlackStatus(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  const status = await slackService.getSlackStatus(userId);
  res.json({ success: true, data: status });
}

export async function disconnectSlack(req: Request, res: Response): Promise<void> {
  const userId = (req as any).user?.id;
  if (userId) {
    await slackService.disconnectUserSlack(userId);
  }
  res.json({ success: true, message: 'Slack disconnected' });
}
