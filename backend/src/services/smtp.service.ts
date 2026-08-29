import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config/env';
import { AppError } from '../types';

export interface SendEmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface SendEmailResult {
  messageId: string;
  previewUrl: string | false;
  rawInfo?: any; // Full Nodemailer info when preview URL is not generated
  accepted: string[];
  rejected: string[];
}



export class SmtpService {
  private transporter: Transporter | null = null;
  private isInitializing: Promise<Transporter> | null = null;

  /**
   * Initializes and retrieves the Nodemailer transporter (using configured or auto-generated Ethereal account)
   */
  private async getTransporter(): Promise<Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    if (this.isInitializing) {
      return this.isInitializing;
    }

    this.isInitializing = (async () => {
      let user = config.ethereal.user;
      let pass = config.ethereal.password;
      let host = config.ethereal.host;
      let port = config.ethereal.port;

      if (!user || !pass) {
        console.log('[SMTP] No Ethereal credentials provided in .env, creating dynamic Ethereal test account...');
        const testAccount = await nodemailer.createTestAccount();
        user = testAccount.user;
        pass = testAccount.pass;
        host = testAccount.smtp.host;
        port = testAccount.smtp.port;
        console.log(`[SMTP] Dynamic Ethereal account ready: ${user}`);
      }

      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
      });

      // Verify connection
      await transporter.verify();
      console.log(`[SMTP] Connected and verified SMTP server at ${host}:${port}`);
      this.transporter = transporter;
      return this.transporter;
    })();

    try {
      const result = await this.isInitializing;
      return result;
    } finally {
      this.isInitializing = null;
    }
  }


  /**
   * Sends an email via Ethereal SMTP and returns message metadata and live preview URL
   */
  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    try {
      const transporter = await this.getTransporter();
      const fromAddress = options.from || config.ethereal.from;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject: options.subject,
        html: options.body,
        text: options.body.replace(/<[^>]*>?/gm, ''), // Plain text fallback
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);

      console.log(`[SMTP] Email sent to "${options.to}" | MessageId: ${info.messageId} | Preview: ${previewUrl || 'N/A'}`);

      return {
        messageId: info.messageId,
        previewUrl,
        accepted: (info.accepted as string[]) || [],
        rejected: (info.rejected as string[]) || [],
      };
    } catch (error: any) {
      console.error(`[SMTP Error] Failed sending email to ${options.to}:`, error.message);
      throw new AppError(`SMTP send failure: ${error.message}`, 502);
    }
  }
}

export const smtpService = new SmtpService();
