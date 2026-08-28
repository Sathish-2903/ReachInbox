import { AppError } from '../types';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface CsvParseResult {
  detected: number;
  valid: number;
  invalid: number;
  invalidItems: string[];
  unique: number;
  emails: string[];
}

export class CsvParserService {
  /**
   * Parses raw CSV or text buffer/string to extract, validate, and deduplicate emails.
   */
  parseEmailsFromContent(content: string): CsvParseResult {
    if (!content || content.trim() === '') {
      throw new AppError('Uploaded file is empty', 400);
    }

    const lines = content.split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
    const validEmails: string[] = [];
    const invalidItems: string[] = [];

    for (const line of lines) {
      // Ignore comment lines
      if (line.startsWith('#')) {
        continue;
      }

      // Split line by comma, semicolon, tab
      const rawTokens = line
        .split(/[,;\t]/)
        .map((t) => t.replace(/^["']|["']$/g, '').trim())
        .filter((t) => t.length > 0);

      // Check if header row
      if (
        rawTokens.length > 0 &&
        (rawTokens[0].toLowerCase() === 'email' ||
          rawTokens[0].toLowerCase() === 'emails' ||
          rawTokens[0].toLowerCase() === 'recipient' ||
          rawTokens[0].toLowerCase() === 'recipients')
      ) {
        continue;
      }

      // Find email candidate tokens in this line
      for (const token of rawTokens) {
        // If token contains whitespace (e.g. a full name "Alice Duplicate"), skip if it has no @
        if (token.includes(' ') && !token.includes('@')) {
          continue;
        }

        const cleaned = token.toLowerCase();
        if (EMAIL_REGEX.test(cleaned)) {
          validEmails.push(cleaned);
        } else if (token.includes('@') || !token.includes(' ')) {
          invalidItems.push(token);
        }
      }
    }

    const uniqueSet = new Set(validEmails);
    const uniqueEmails = Array.from(uniqueSet);
    const detected = validEmails.length + invalidItems.length;

    return {
      detected,
      valid: validEmails.length,
      invalid: invalidItems.length,
      invalidItems: invalidItems.slice(0, 50),
      unique: uniqueEmails.length,
      emails: uniqueEmails,
    };
  }
}

export const csvParserService = new CsvParserService();
