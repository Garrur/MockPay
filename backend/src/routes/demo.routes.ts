import { FastifyInstance } from 'fastify';
import { prisma } from '../lib/prisma';
import { clerkAuth } from './projects.routes';
import { customAlphabet } from 'nanoid';

// Short memorable token for demo URLs
const nanoToken = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);

export async function demoRoutes(fastify: FastifyInstance) {
  // ── Authenticated endpoints ────────────────────────────────

  // POST /api/demo-links — Create a shareable demo link
  fastify.post('/demo-links', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id, amount, currency = 'INR', label, allowed_outcomes, max_uses, expires_in_days } = req.body as {
      project_id: string;
      amount: number;
      currency?: string;
      label?: string;
      allowed_outcomes?: string[];
      max_uses?: number;
      expires_in_days?: number;
    };

    if (!project_id || !amount) {
      return reply.status(400).send({ error: 'project_id and amount are required' });
    }

    const project = await prisma.project.findFirst({
      where: { id: project_id, userId: req.user.id },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const token = nanoToken();
    const expiresAt = expires_in_days
      ? new Date(Date.now() + expires_in_days * 24 * 60 * 60 * 1000)
      : undefined;

    const demoLink = await prisma.demoLink.create({
      data: {
        token,
        projectId: project_id,
        amount: Math.round(amount),
        currency,
        label,
        allowedOutcomes: allowed_outcomes || ['success', 'failed', 'cancelled'],
        maxUses: max_uses,
        expiresAt,
      },
    });

    const publicUrl = `${process.env.FRONTEND_URL}/demo/${token}`;

    return reply.status(201).send({
      id: demoLink.id,
      token: demoLink.token,
      public_url: publicUrl,
      amount: demoLink.amount,
      currency: demoLink.currency,
      label: demoLink.label,
      allowed_outcomes: demoLink.allowedOutcomes,
      max_uses: demoLink.maxUses,
      expires_at: demoLink.expiresAt,
      use_count: demoLink.useCount,
      created_at: demoLink.createdAt,
    });
  });

  // GET /api/demo-links — List all demo links for a project
  fastify.get('/demo-links', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { project_id } = req.query as { project_id: string };
    if (!project_id) return reply.status(400).send({ error: 'project_id required' });

    const project = await prisma.project.findFirst({
      where: { id: project_id, userId: req.user.id },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const links = await prisma.demoLink.findMany({
      where: { projectId: project_id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      links: links.map(l => ({
        ...l,
        public_url: `${process.env.FRONTEND_URL}/demo/${l.token}`,
      })),
    };
  });

  // DELETE /api/demo-links/:id
  fastify.delete('/demo-links/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const link = await prisma.demoLink.findFirst({ where: { id }, include: { project: true } });
    if (!link || link.project.userId !== req.user.id) {
      return reply.status(404).send({ error: 'Demo link not found' });
    }
    await prisma.demoLink.delete({ where: { id } });
    return { success: true };
  });

  // ── Public endpoints (no auth required) ───────────────────

  // GET /api/public/demo/:token — Get metadata for a demo link
  fastify.get('/public/demo/:token', async (req, reply) => {
    const { token } = req.params as { token: string };
    const link = await prisma.demoLink.findUnique({
      where: { token },
      include: { project: { select: { name: true } } },
    });

    if (!link) return reply.status(404).send({ error: 'Demo link not found' });
    if (link.expiresAt && new Date() > link.expiresAt) {
      return reply.status(410).send({ error: 'This demo link has expired' });
    }
    if (link.maxUses && link.useCount >= link.maxUses) {
      return reply.status(410).send({ error: 'This demo link has reached its maximum uses' });
    }

    return {
      token: link.token,
      amount: link.amount,
      currency: link.currency,
      label: link.label || `${(link as any).project?.name} Demo`,
      project_name: (link as any).project?.name,
      allowed_outcomes: link.allowedOutcomes,
      expires_at: link.expiresAt,
    };
  });

  // POST /api/public/demo/:token/simulate — Run a simulation (public, no auth)
  fastify.post('/public/demo/:token/simulate', async (req, reply) => {
    const { token } = req.params as { token: string };
    const { outcome } = req.body as { outcome: 'success' | 'failed' | 'cancelled' };

    const link = await prisma.demoLink.findUnique({ where: { token } });
    if (!link) return reply.status(404).send({ error: 'Demo link not found' });
    if (link.expiresAt && new Date() > link.expiresAt) {
      return reply.status(410).send({ error: 'Link expired' });
    }
    if (link.maxUses && link.useCount >= link.maxUses) {
      return reply.status(410).send({ error: 'Link limit reached' });
    }
    if (!link.allowedOutcomes.includes(outcome)) {
      return reply.status(400).send({ error: `Outcome "${outcome}" is not allowed for this demo link` });
    }

    // Increment use count
    await prisma.demoLink.update({
      where: { token },
      data: { useCount: { increment: 1 } },
    });

    // Return a simulated response (no real payment created for public demos)
    const simulatedId = `demo_${Date.now()}`;
    return {
      simulation_id: simulatedId,
      outcome,
      amount: link.amount,
      currency: link.currency,
      timestamp: new Date().toISOString(),
      message: outcome === 'success'
        ? '✅ Payment simulation successful!'
        : outcome === 'failed'
        ? '❌ Payment simulation failed (as configured)'
        : '🚫 Payment cancelled',
    };
  });
}
