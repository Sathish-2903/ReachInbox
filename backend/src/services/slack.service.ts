import axios from 'axios';
import { config } from '../config/env';
import { prisma } from '../config/database';
import { AppError } from '../types';

export interface SlackTokenResponse {
  ok: boolean;
  access_token?: string;
  token_type?: string;
  scope?: string;
  bot_user_id?: string;
  app_id?: string;
  team?: {
    name: string;
    id: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  error?: string;
}

export class SlackService {
  /**
   * Generates real Slack OAuth authorization URL
   */
  getAuthorizationUrl(state = 'reachinbox-slack-auth'): string {
    const clientId = config.slack.clientId;
    const redirectUri = encodeURIComponent(config.slack.redirectUri);
    const scope = encodeURIComponent('chat:write,chat:write.public,incoming-webhook');

    return `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Exchanges OAuth authorization code for Slack access token
   */
  async exchangeCodeForToken(code: string): Promise<SlackTokenResponse> {
    try {
      const response = await axios.post<SlackTokenResponse>(
        'https://slack.com/api/oauth.v2.access',
        new URLSearchParams({
          client_id: config.slack.clientId,
          client_secret: config.slack.clientSecret,
          code,
          redirect_uri: config.slack.redirectUri,
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.ok) {
        throw new AppError(`Slack OAuth error: ${response.data.error || 'Unknown error'}`, 400);
      }

      return response.data;
    } catch (err: any) {
      console.error('[SlackService] Error exchanging code for token:', err.message);
      throw new AppError(err.message || 'Failed to exchange Slack OAuth code', 500);
    }
  }

  /**
   * Saves Slack access token for a user
   */
  async saveUserSlackToken(userId: string, token: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { slackAccessToken: token },
    });
    console.log(`[SlackService] Saved Slack token for user ${userId}`);
  }

  /**
   * Disconnects Slack for a user
   */
  async disconnectUserSlack(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { slackAccessToken: null },
    });
    console.log(`[SlackService] Disconnected Slack for user ${userId}`);
  }

  /**
   * Checks whether Slack is currently connected for a user or system
   */
  async getSlackStatus(userId?: string): Promise<{ connected: boolean; userId?: string }> {
    if (!userId) {
      // Check if any user or system token exists
      const userWithToken = await prisma.user.findFirst({
        where: { slackAccessToken: { not: null } },
      });
      return { connected: !!userWithToken, userId: userWithToken?.id };
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return { connected: !!user?.slackAccessToken, userId };
  }

  /**
   * Dispatches Slack rate limit notification if Slack is connected.
   * Gracefully ignores if Slack is not connected.
   */
  async sendRateLimitNotification(params: {
    sender: string;
    limit: number;
    nextWindow: string;
    userId?: string;
  }): Promise<boolean> {
    try {
      let token: string | null = null;

      if (params.userId) {
        const user = await prisma.user.findUnique({ where: { id: params.userId } });
        token = user?.slackAccessToken || null;
      }

      if (!token) {
        const userWithToken = await prisma.user.findFirst({
          where: { slackAccessToken: { not: null } },
        });
        token = userWithToken?.slackAccessToken || null;
      }

      if (!token) {
        console.log(`[SlackService] Slack not connected for sender "${params.sender}". Skipping notification.`);
        return false;
      }

      const messageText = `⚠️ *ReachInbox Hourly Limit Hit*\n• *Sender:* \`${params.sender}\`\n• *Hourly Limit:* ${params.limit} emails/hr\n• *Action:* Remaining emails automatically rescheduled to next window (*${params.nextWindow}*).`;

      const response = await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: '#general', // or default channel for token
          text: messageText,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.ok) {
        console.log(`[SlackService] Rate-limit notification sent to Slack successfully.`);
        return true;
      } else {
        console.warn(`[SlackService] Slack postMessage response not ok: ${response.data.error}`);
        return false;
      }
    } catch (error: any) {
      console.warn(`[SlackService] Error sending Slack notification (non-fatal): ${error.message}`);
      return false;
    }
  }
}

export const slackService = new SlackService();
