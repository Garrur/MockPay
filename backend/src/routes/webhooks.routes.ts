import { FastifyInstance } from 'fastify';
import { verifyToken } from '@clerk/backend';
import { prisma } from '../lib/prisma';
import { customAlphabet } from 'nanoid';
import { webhookQueue } from '../queue/webhook.queue';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 32);

async function clerkAuth(req: any, reply: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    const user = await prisma.user.findUnique({ where: { clerkId: payload.sub } });
    if (!user) return reply.status(401).send({ error: 'User not found' });
    req.user = user;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function webhooksRoutes(fastify: FastifyInstance) {
  // POST /api/webhooks — Register a webhook endpoint
  fastify.post('/webhooks', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id, url, events } = req.body as {
      project_id: string; url: string; events?: string[];
    };
    if (!project_id || !url) return reply.status(400).send({ error: 'project_id and url are required' });
    try { new URL(url); } catch { return reply.status(400).send({ error: 'Invalid URL format' }); }

    const project = await prisma.project.findFirst({ where: { id: project_id, userId: req.user.id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const secret = `whsec_${nanoid()}`;
    const webhook = await prisma.webhook.create({
      data: {
        projectId: project_id, url, secret,
        events: events || ['payment.created', 'payment.success', 'payment.failed', 'payment.cancelled'],
      },
    });

    return reply.status(201).send({
      id: webhook.id, url: webhook.url, events: webhook.events,
      secret, is_active: webhook.isActive, created_at: webhook.createdAt,
    });
  });

  // GET /api/webhooks
  fastify.get('/webhooks', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id } = req.query as { project_id: string };
    if (!project_id) return reply.status(400).send({ error: 'project_id required' });

    const project = await prisma.project.findFirst({ where: { id: project_id, userId: req.user.id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const webhooks = await prisma.webhook.findMany({
      where: { projectId: project_id },
      select: { id: true, url: true, events: true, isActive: true, createdAt: true, _count: { select: { webhookEvents: true } } },
    });
    return { webhooks };
  });

  // DELETE /api/webhooks/:id
  fastify.delete('/webhooks/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const webhook = await prisma.webhook.findFirst({ where: { id }, include: { project: true } });
    if (!webhook || webhook.project.userId !== req.user.id) return reply.status(404).send({ error: 'Webhook not found' });
    await prisma.webhook.delete({ where: { id } });
    return { success: true };
  });

  // GET /api/webhook-events — Delivery logs with filters
  fastify.get('/webhook-events', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id, page = '1', limit = '20', status, event_type } = req.query as {
      project_id: string; page?: string; limit?: string; status?: string; event_type?: string;
    };
    if (!project_id) return reply.status(400).send({ error: 'project_id required' });

    const project = await prisma.project.findFirst({ where: { id: project_id, userId: req.user.id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);
    const where: any = { webhook: { projectId: project_id } };
    if (status) where.status = status;
    if (event_type) where.eventType = event_type;

    const [events, total] = await Promise.all([
      prisma.webhookEvent.findMany({
        where,
        include: {
          webhook: { select: { url: true } },
          payment: { select: { orderId: true, amount: true, currency: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.webhookEvent.count({ where }),
    ]);
    return { events, total, page: pageNum, limit: limitNum };
  });

  // POST /api/webhooks/replay/:eventId — Manual replay
  fastify.post('/webhooks/replay/:eventId', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { eventId } = req.params as { eventId: string };
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId },
      include: { webhook: { include: { project: true } } },
    });
    if (!event) return reply.status(404).send({ error: 'Event not found' });
    if (event.webhook.project.userId !== req.user.id) return reply.status(403).send({ error: 'Forbidden' });

    await prisma.webhookEvent.update({ where: { id: eventId }, data: { status: 'pending', nextRetryAt: null } });
    await webhookQueue.add('deliver', {
      webhookEventId: event.id,
      webhookUrl: event.webhook.url,
      payload: event.payload,
      secret: event.webhook.secret,
    });

    return { success: true, message: `Event ${eventId} queued for replay.` };
  });
}
