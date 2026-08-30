import { ConnectionOptions } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { config } from './env';

export const redisConnectionOptions: ConnectionOptions = config.redis.url
  ? ({
      url: config.redis.url,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    } as ConnectionOptions)
  : {
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      maxRetriesPerRequest: null, // Required by BullMQ
      enableReadyCheck: false,
    };

export const redisClient = config.redis.url
  ? new Redis(config.redis.url, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    })
  : new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
