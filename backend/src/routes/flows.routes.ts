import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { clerkAuth } from './projects.routes';
import { webhookQueue } from '../queue/webhook.queue';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 16);

const DEFAULT_STEPS = [
  { type: 'payment.created', delayMs: 0,    triggerWebhook: true  },
  { type: 'payment.pending', delayMs: 1000, triggerWebhook: false },
  { type: 'payment.success', delayMs: 3000, triggerWebhook: true  },
];

export async function flowsRoutes(fastify: FastifyInstance) {
  // POST /api/flows — Create a new flow
  fastify.post('/flows', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id, name, steps } = req.body as {
      project_id: string;
      name: string;
      steps?: Array<{ type: string; delayMs: number; triggerWebhook: boolean }>;
    };

    if (!project_id || !name) {
      return reply.status(400).send({ error: 'project_id and name are required' });
    }

    const project = await prisma.project.findFirst({
      where: { id: project_id, userId: req.user.id },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const flow = await prisma.paymentFlow.create({
      data: {
        projectId: project_id,
        name,
        steps: steps || DEFAULT_STEPS,
      },
    });

    return reply.status(201).send({ flow });
  });

  // GET /api/flows — List flows for a project
  fastify.get('/flows', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id } = req.query as { project_id: string };
    if (!project_id) return reply.status(400).send({ error: 'project_id required' });

    const project = await prisma.project.findFirst({
      where: { id: project_id, userId: req.user.id },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const flows = await prisma.paymentFlow.findMany({
      where: { projectId: project_id },
      orderBy: { createdAt: 'desc' },
    });
    return { flows };
  });

  // DELETE /api/flows/:id
  fastify.delete('/flows/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const flow = await prisma.paymentFlow.findFirst({
      where: { id },
      include: { project: true },
    });
    if (!flow || flow.project.userId !== req.user.id) {
      return reply.status(404).send({ error: 'Flow not found' });
    }
    await prisma.paymentFlow.delete({ where: { id } });
    return { success: true };
  });

  // POST /api/flows/:id/run — Execute a flow
  fastify.post('/flows/:id/run', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const flow = await prisma.paymentFlow.findFirst({
      where: { id },
      include: { project: true },
    });
    if (!flow || flow.project.userId !== req.user.id) {
      return reply.status(404).send({ error: 'Flow not found' });
    }

    // Mark as running
    await prisma.paymentFlow.update({
      where: { id },
      data: { status: 'running', lastRunAt: new Date() },
    });

    // Create a synthetic payment for this flow
    const paymentId = `pay_${nanoid()}`;
    const paymentUrl = `${process.env.FRONTEND_URL}/pay/${paymentId}`;

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        projectId: flow.projectId,
        amount: 50000,
        currency: 'INR',
        orderId: `flow_${id}_${Date.now()}`,
        description: `Flow: ${flow.name}`,
        paymentUrl,
        status: 'created',
        metadata: { flowId: id, flowName: flow.name } as any,
      },
    });

    const steps = flow.steps as Array<{ type: string; delayMs: number; triggerWebhook: boolean }>;

    // Enqueue each step as a delayed job
    let cumulativeDelay = 0;
    const results: any[] = [];

    for (const step of steps) {
      cumulativeDelay += step.delayMs;

      if (step.triggerWebhook) {
        const webhooks = await prisma.webhook.findMany({
          where: { projectId: flow.projectId, isActive: true },
        });

        for (const webhook of webhooks) {
          const payload = {
            id: `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`,
            type: step.type,
            created: Math.floor(Date.now() / 1000),
            data: { object: { ...payment, status: step.type.replace('payment.', '') } },
            flow: { id, name: flow.name },
          };

          const webhookEvent = await prisma.webhookEvent.create({
            data: {
              webhookId: webhook.id,
              paymentId: payment.id,
              eventType: step.type,
              payload,
              status: 'pending',
            },
          });

          await webhookQueue.add(
            'deliver',
            {
              webhookEventId: webhookEvent.id,
              webhookUrl: webhook.url,
              payload,
              secret: webhook.secret,
            },
            { delay: cumulativeDelay }
          );

          results.push({ step: step.type, webhookEventId: webhookEvent.id, delayMs: cumulativeDelay });
        }
      }
    }

    // Mark as completed (the webhooks fire asynchronously)
    await prisma.paymentFlow.update({
      where: { id },
      data: { status: 'completed' },
    });

    return {
      flow_id: id,
      payment_id: payment.id,
      queued_events: results,
      message: `Flow "${flow.name}" started. ${results.length} events queued.`,
    };
  });
}
