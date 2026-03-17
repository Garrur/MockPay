import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { config } from 'dotenv';

config();

import { prisma } from './lib/prisma';
import { paymentsRoutes } from './routes/payments.routes';
import { webhooksRoutes } from './routes/webhooks.routes';
import { projectsRoutes } from './routes/projects.routes';
import { keysRoutes } from './routes/keys.routes';
import { startWebhookWorker } from './queue/webhook.worker';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { colorize: true } }
        : undefined,
  },
});

async function bootstrap() {
  // CORS
  await fastify.register(cors, {
    origin: [process.env.FRONTEND_URL || 'http://localhost:3000', '*'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limit
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (req) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        return authHeader.slice(7, 20); // use key prefix as identifier
      }
      return req.ip;
    },
  });

  // Health check
  fastify.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API Routes
  await fastify.register(projectsRoutes, { prefix: '/api' });
  await fastify.register(keysRoutes, { prefix: '/api' });
  await fastify.register(paymentsRoutes, { prefix: '/api' });
  await fastify.register(webhooksRoutes, { prefix: '/api' });

  // Start webhook delivery worker
  startWebhookWorker();

  const port = parseInt(process.env.PORT || '4000', 10);
  await fastify.listen({ port, host: '0.0.0.0' });
  console.log(`🚀 SandboxPay API running on port ${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});
