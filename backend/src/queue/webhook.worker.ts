import { Worker, Job } from 'bullmq';
import axios from 'axios';
import crypto from 'crypto';
import { prisma } from '../lib/prisma';
import { redisConnection } from './webhook.queue';

interface WebhookJobData {
  webhookEventId: string;
  webhookUrl: string;
  payload: object;
  secret: string;
}

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

async function processWebhook(job: Job<WebhookJobData>) {
  const { webhookEventId, webhookUrl, payload, secret } = job.data;

  const payloadString = JSON.stringify(payload);
  const signature = signPayload(payloadString, secret);

  const startTime = Date.now();
  let httpStatus: number | undefined;
  let responseBody: string | undefined;

  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'X-SandboxPay-Signature': `sha256=${signature}`,
        'X-SandboxPay-Timestamp': String(Math.floor(Date.now() / 1000)),
        'User-Agent': 'SandboxPay-Webhooks/1.0',
      },
      timeout: 10000,
      validateStatus: (status) => status < 500,
    });

    httpStatus = response.status;
    responseBody = JSON.stringify(response.data).slice(0, 500);

    if (response.status >= 200 && response.status < 300) {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: 'delivered',
          httpStatus,
          responseBody,
          deliveredAt: new Date(),
          attempts: job.attemptsMade + 1,
        },
      });
      return { success: true, httpStatus, duration: Date.now() - startTime };
    } else {
      throw new Error(`Non-2xx response: ${response.status}`);
    }
  } catch (error) {
    httpStatus = httpStatus || 0;
    responseBody = error instanceof Error ? error.message : 'Unknown error';

    const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts || 5);

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: {
        status: isLastAttempt ? 'failed' : 'pending',
        httpStatus,
        responseBody,
        attempts: job.attemptsMade + 1,
        nextRetryAt: isLastAttempt
          ? null
          : new Date(Date.now() + Math.pow(2, job.attemptsMade) * 2000),
      },
    });

    throw error; // Re-throw to trigger BullMQ retry
  }
}

export function startWebhookWorker() {
  const worker = new Worker<WebhookJobData>('webhook-delivery', processWebhook, {
    connection: redisConnection,
    concurrency: 10,
  });

  worker.on('completed', (job) => {
    console.log(`✅ Webhook delivered: job ${job.id}`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Webhook failed: job ${job?.id} - ${err.message}`);
  });

  console.log('🔧 Webhook worker started');
  return worker;
}
