import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export async function getGoogleAuthUrl(req: Request, res: Response): Promise<void> {
  const url = authService.getGoogleAuthUrl();
  res.json({ success: true, url });
}

export async function handleGoogleCallback(req: Request, res: Response): Promise<void> {
  const code = req.query.code as string;
  if (!code) {
    res.status(400).json({ success: false, error: 'Google authorization code is required' });
    return;
  }

  const profile = await authService.exchangeGoogleCode(code);
  const user = await authService.findOrCreateUser(profile);
  const token = authService.generateToken(user);

  // Redirect to frontend with token in query param
  res.redirect(`/?token=${token}`);
}

export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  if (!req.user?.id) {
    res.status(401).json({ success: false, error: 'Not authenticated' });
    return;
  }

  const user = await authService.getUserById(req.user.id);
  res.json({ success: true, data: user });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.json({ success: true, message: 'Logged out successfully' });
}
