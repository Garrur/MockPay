import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { apiKeyAuth } from '../middleware/auth.middleware';
import { webhookQueue } from '../queue/webhook.queue';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

// Test card simulation rules
const CARD_RULES: Record<string, 'success' | 'failed'> = {
  '4242424242424242': 'success',
  '4000000000000002': 'failed',
};

const UPI_RULES: Record<string, 'success' | 'pending' | 'failed'> = {
  success: 'success',
  pending: 'pending',
  failure: 'failed',
};

export async function paymentsRoutes(fastify: FastifyInstance) {
  // POST /api/payments — Create payment intent
  fastify.post('/payments', { preHandler: apiKeyAuth }, async (req: any, reply) => {
    const { amount, currency = 'INR', order_id, description, metadata, success_url, cancel_url } = req.body as {
      amount: number;
      currency?: string;
      order_id: string;
      description?: string;
      metadata?: Record<string, unknown>;
      success_url?: string;
      cancel_url?: string;
    };

    if (!amount || !order_id) {
      return reply.status(400).send({ error: 'amount and order_id are required' });
    }

    const paymentId = `pay_${nanoid()}`;
    const paymentUrl = `${process.env.FRONTEND_URL}/pay/${paymentId}`;

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        projectId: req.project.id,
        amount: Math.round(amount),
        currency,
        orderId: order_id,
        description,
        successUrl: success_url,
        cancelUrl: cancel_url,
        paymentUrl,
        status: 'created',
        metadata: (metadata || {}) as any,
      },
    });

    // Fire payment.created webhook
    await enqueueWebhooks(payment.projectId, payment.id, 'payment.created', payment);

    return reply.status(201).send({
      payment_id: payment.id,
      payment_url: payment.paymentUrl,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      created_at: payment.createdAt,
    });
  });

  // GET /api/payments — List payments for user's dashboard (uses clerkAuth instead of apiKeyAuth)
  fastify.get('/payments', { preHandler: require('./projects.routes').clerkAuth }, async (req: any, reply) => {
    const { page = '1', limit = '20', status } = req.query as {
      page?: string; limit?: string; status?: string;
    };

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10), 100);

    // Get all projects owned by the user
    const userProjects = await prisma.project.findMany({
      where: { userId: req.user.id },
      select: { id: true }
    });
    const projectIds = userProjects.map(p => p.id);

    const where: any = { projectId: { in: projectIds } };
    if (status) where.status = status;

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      prisma.payment.count({ where }),
    ]);

    return { payments, total, page: pageNum, limit: limitNum };
  });

  // GET /api/payments/:id — Get single payment
  fastify.get('/payments/:id', { preHandler: apiKeyAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const payment = await prisma.payment.findFirst({
      where: { id, projectId: req.project.id },
    });
    if (!payment) return reply.status(404).send({ error: 'Payment not found' });
    return { payment };
  });

  // GET /pay-public/:id — Public endpoint for checkout page (no auth)
  fastify.get('/pay-public/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { project: { select: { name: true } } },
    });
    if (!payment) return reply.status(404).send({ error: 'Payment not found' });
    return {
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      order_id: payment.orderId,
      description: payment.description,
      status: payment.status,
      project_name: (payment as any).project?.name,
      success_url: payment.successUrl,
      cancel_url: payment.cancelUrl,
    };
  });

  // POST /api/payments/:id/simulate — Simulate outcome
  fastify.post('/payments/:id/simulate', async (req, reply) => {
    const { id } = req.params as { id: string };
    const { outcome, card_number, upi_id, upi_scenario } = req.body as {
      outcome?: 'success' | 'failed' | 'cancelled';
      card_number?: string;
      upi_id?: string;
      upi_scenario?: 'success' | 'pending' | 'failure';
    };

    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) return reply.status(404).send({ error: 'Payment not found' });

    if (['success', 'failed', 'cancelled'].includes(payment.status)) {
      return reply.status(400).send({ error: 'Payment already in terminal state' });
    }

    let newStatus: 'success' | 'failed' | 'cancelled' | 'pending' = 'pending';
    let cardLast4: string | undefined;

    if (outcome) {
      newStatus = outcome;
    } else if (card_number) {
      const normalized = card_number.replace(/\s/g, '');
      newStatus = CARD_RULES[normalized] || 'failed';
      cardLast4 = normalized.slice(-4);
    } else if (upi_scenario) {
      newStatus = UPI_RULES[upi_scenario] || 'failed';
    }

    const updated = await prisma.payment.update({
      where: { id },
      data: {
        status: newStatus,
        cardLast4,
        upiId: upi_id,
      },
    });

    // Fire webhook
    if (newStatus === 'success' || newStatus === 'failed' || newStatus === 'cancelled') {
      const eventType = `payment.${newStatus}`;
      await enqueueWebhooks(payment.projectId, payment.id, eventType, updated);
    }

    return { payment_id: id, new_status: newStatus };
  });

  // POST /api/simulate-payment — Advanced simulation for hosted checkout (no API key required, payment_id is the token)
  fastify.post('/simulate-payment', async (req, reply) => {
    const { payment_id, status, delay = 0, card_details, upi_details } = req.body as {
      payment_id: string;
      status: 'success' | 'failed' | 'pending';
      delay?: number;
      card_details?: { last4: string; holder: string };
      upi_details?: { upi_id: string };
    };

    if (!payment_id || !status) {
      return reply.status(400).send({ error: 'payment_id and status are required' });
    }

    const payment = await prisma.payment.findUnique({ where: { id: payment_id } });
    if (!payment) return reply.status(404).send({ error: 'Payment not found' });

    if (['success', 'failed', 'cancelled'].includes(payment.status)) {
      return reply.status(400).send({ error: 'Payment already in terminal state' });
    }

    // Simulate network delay
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay * 1000));
    }

    const updated = await prisma.payment.update({
      where: { id: payment_id },
      data: {
        status: status as any,
        cardLast4: card_details?.last4,
        upiId: upi_details?.upi_id,
      },
    });

    // Fire webhook if terminal
    if (status === 'success' || status === 'failed') {
      await enqueueWebhooks(payment.projectId, payment.id, `payment.${status}`, updated);
    }

    return { success: true, status: updated.status };
  });
}


async function enqueueWebhooks(
  projectId: string,
  paymentId: string,
  eventType: string,
  paymentData: any
) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      projectId,
      isActive: true,
      events: { has: eventType },
    },
  });

  for (const webhook of webhooks) {
    const payload = {
      id: `evt_${Date.now()}`,
      type: eventType,
      created: Math.floor(Date.now() / 1000),
      data: { object: paymentData },
    };

    const webhookEvent = await prisma.webhookEvent.create({
      data: {
        webhookId: webhook.id,
        paymentId,
        eventType,
        payload,
        status: 'pending',
      },
    });

    await webhookQueue.add('deliver', {
      webhookEventId: webhookEvent.id,
      webhookUrl: webhook.url,
      payload,
      secret: webhook.secret,
    });
  }
}
