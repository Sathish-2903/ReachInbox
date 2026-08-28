import { Client } from '@elastic/elasticsearch';
import { config } from '../config/env';

export const EMAIL_INDEX = 'emails';

export interface EmailIndexDoc {
  id: string;
  userId?: string | null;
  recipient: string;
  subject: string;
  body: string;
  status: string;
  scheduledAt: string | Date;
  sentAt?: string | Date | null;
  createdAt?: string | Date;
}

export class ElasticsearchService {
  private client: Client;
  private isIndexInitialized = false;

  constructor() {
    this.client = new Client({
      node: config.elasticsearchUrl,
    });
  }

  /**
   * Ensures the 'emails' index with full-text mappings exists
   */
  async ensureIndexExists(): Promise<void> {
    if (this.isIndexInitialized) return;

    try {
      const exists = await this.client.indices.exists({ index: EMAIL_INDEX });
      if (!exists) {
        await this.client.indices.create({
          index: EMAIL_INDEX,
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              recipient: {
                type: 'text',
                fields: { keyword: { type: 'keyword' } },
              },
              subject: { type: 'text' },
              body: { type: 'text' },
              status: { type: 'keyword' },
              scheduledAt: { type: 'date' },
              sentAt: { type: 'date' },
              createdAt: { type: 'date' },
            },
          },
        });
        console.log(`[Elasticsearch] Created index "${EMAIL_INDEX}" with search mappings.`);
      }
      this.isIndexInitialized = true;
    } catch (err: any) {
      console.warn(`[Elasticsearch] Failed to ensure index (non-fatal): ${err.message}`);
    }
  }

  /**
   * Indexes or updates an email document in Elasticsearch.
   * Fails gracefully without breaking DB persistence.
   */
  async indexEmail(doc: EmailIndexDoc): Promise<void> {
    try {
      await this.ensureIndexExists();

      await this.client.index({
        index: EMAIL_INDEX,
        id: doc.id,
        document: {
          id: doc.id,
          userId: doc.userId || null,
          recipient: doc.recipient,
          subject: doc.subject,
          body: doc.body,
          status: doc.status,
          scheduledAt: new Date(doc.scheduledAt).toISOString(),
          sentAt: doc.sentAt ? new Date(doc.sentAt).toISOString() : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        },
        refresh: true, // Make immediately searchable in dev
      });

      console.log(`[Elasticsearch] Indexed email ${doc.id} (status: ${doc.status})`);
    } catch (err: any) {
      console.warn(`[Elasticsearch] Error indexing email ${doc.id} (non-fatal): ${err.message}`);
    }
  }

  /**
   * Searches emails by recipient, subject, or body with optional userId filtering
   */
  async searchEmails(query: string, userId?: string, limit = 50): Promise<EmailIndexDoc[]> {
    try {
      await this.ensureIndexExists();

      const mustClauses: any[] = [];

      if (query && query.trim() !== '') {
        mustClauses.push({
          multi_match: {
            query: query.trim(),
            fields: ['recipient^3', 'subject^2', 'body'],
            fuzziness: 'AUTO',
          },
        });
      } else {
        mustClauses.push({ match_all: {} });
      }

      if (userId) {
        mustClauses.push({ term: { userId } });
      }

      const result = await this.client.search<EmailIndexDoc>({
        index: EMAIL_INDEX,
        size: limit,
        query: {
          bool: {
            must: mustClauses,
          },
        },
        sort: [{ scheduledAt: { order: 'desc' } }],
      });

      return result.hits.hits.map((hit) => hit._source as EmailIndexDoc);
    } catch (err: any) {
      console.error(`[Elasticsearch] Search query failed: ${err.message}`);
      return [];
    }
  }
}

export const elasticsearchService = new ElasticsearchService();
