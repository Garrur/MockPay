import { Queue, ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

// Use IORedis instance with maxRetriesPerRequest set to null as required by BullMQ
// Provide it as any to bypass the internal typescript type conflict between standalone ioredis and bullmq's bundled version
export const redisConnection: any = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null, tls: { rejectUnauthorized: false } })
  : {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null
    };

export const webhookQueue = new Queue('webhook-delivery', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});
