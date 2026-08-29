import axios from 'axios';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../types';

export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthJwtPayload {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export class AuthService {
  /**
   * Checks whether Google and Slack OAuth credentials are configured
   */
  getAuthStatus() {
    return {
      googleConfigured: Boolean(config.google.clientId && config.google.clientId.trim() !== ''),
      slackConfigured: Boolean(config.slack.clientId && config.slack.clientId.trim() !== ''),
    };
  }

  /**
   * Generates Google OAuth 2.0 Authorization URL
   */
  getGoogleAuthUrl(state = 'reachinbox-google-auth'): string {
    if (!config.google.clientId || config.google.clientId.trim() === '') {
      throw new AppError(
        'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env',
        400
      );
    }

    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: config.google.clientId,
      redirect_uri: config.google.callbackUrl,
      response_type: 'code',
      scope: 'openid profile email',
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `${rootUrl}?${params.toString()}`;
  }


  /**
   * Exchanges Google authorization code for access tokens and retrieves user profile
   */
  async exchangeGoogleCode(code: string): Promise<GoogleUserProfile> {
    try {
      const tokenRes = await axios.post<{ access_token: string; id_token: string }>(
        'https://oauth2.googleapis.com/token',
        {
          code,
          client_id: config.google.clientId,
          client_secret: config.google.clientSecret,
          redirect_uri: config.google.callbackUrl,
          grant_type: 'authorization_code',
        }
      );

      const userRes = await axios.get<GoogleUserProfile>(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokenRes.data.access_token}`,
          },
        }
      );

      return userRes.data;
    } catch (err: any) {
      console.error('[AuthService] Google OAuth exchange error:', err.response?.data || err.message);
      throw new AppError('Failed to exchange Google OAuth code with Google APIs', 401);
    }
  }

  /**
   * Finds or creates a user in PostgreSQL based on Google OAuth profile
   */
  async findOrCreateUser(profile: GoogleUserProfile) {
    const user = await prisma.user.upsert({
      where: { googleId: profile.id },
      update: {
        name: profile.name,
        email: profile.email.toLowerCase(),
        avatar: profile.picture || null,
      },
      create: {
        googleId: profile.id,
        name: profile.name,
        email: profile.email.toLowerCase(),
        avatar: profile.picture || null,
      },
    });

    return user;
  }

  /**
   * Signs a JWT session token for authenticated user
   */
  generateToken(user: { id: string; email: string; name: string; avatar?: string | null }): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || null,
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    );
  }

  /**
   * Verifies and decodes JWT token
   */
  verifyToken(token: string): AuthJwtPayload {
    try {
      return jwt.verify(token, config.jwtSecret) as AuthJwtPayload;
    } catch (err) {
      throw new AppError('Invalid or expired authentication token', 401);
    }
  }

  /**
   * Fetches current authenticated user details from database
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        slackAccessToken: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      ...user,
      hasSlackConnected: !!user.slackAccessToken,
    };
  }
}

export const authService = new AuthService();
