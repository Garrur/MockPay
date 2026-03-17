import { FastifyInstance } from 'fastify';
import { verifyToken } from '@clerk/backend';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';
import { customAlphabet } from 'nanoid';

const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 24);

async function clerkAuth(req: any, reply: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    req.clerkUserId = payload.sub;
    const user = await prisma.user.findUnique({ where: { clerkId: payload.sub } });
    if (!user) return reply.status(401).send({ error: 'User not found. Create a project first.' });
    req.user = user;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function keysRoutes(fastify: FastifyInstance) {
  // POST /api/projects/:id/keys — generate a new API key pair
  fastify.post('/projects/:id/keys', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id: projectId } = req.params as { id: string };
    const { label } = (req.body as { label?: string }) || {};

    const project = await prisma.project.findFirst({
      where: { id: projectId, userId: req.user.id },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const publicKey = `pk_test_${nanoid()}`;
    const secretKeyRaw = `sk_test_${nanoid()}`;
    const secretKeyHash = crypto.createHash('sha256').update(secretKeyRaw).digest('hex');
    const secretKeyPreview = secretKeyRaw.slice(-4);

    const apiKey = await prisma.apiKey.create({
      data: {
        projectId,
        publicKey,
        secretKeyHash,
        secretKeyPreview,
        label: label || 'Default',
      },
    });

    return reply.status(201).send({
      id: apiKey.id,
      publicKey: apiKey.publicKey,
      secretKey: secretKeyRaw,
      secretKeyPreview: `sk_test_...${secretKeyPreview}`,
      label: apiKey.label,
      createdAt: apiKey.createdAt,
      warning: 'Save your secret key now. It will not be shown again.',
    });
  });

  // GET /api/projects/:id/keys — list keys (no raw secret)
  fastify.get('/projects/:id/keys', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id: projectId } = req.params as { id: string };
    const project = await prisma.project.findFirst({ where: { id: projectId, userId: req.user.id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });

    const keys = await prisma.apiKey.findMany({
      where: { projectId },
      select: {
        id: true, publicKey: true, secretKeyPreview: true,
        label: true, isActive: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return { keys };
  });

  // DELETE /api/keys/:keyId — revoke key
  fastify.delete('/keys/:keyId', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { keyId } = req.params as { keyId: string };
    const key = await prisma.apiKey.findFirst({
      where: { id: keyId },
      include: { project: true },
    });
    if (!key || key.project.userId !== req.user.id) return reply.status(404).send({ error: 'Key not found' });

    await prisma.apiKey.update({ where: { id: keyId }, data: { isActive: false } });
    return { success: true };
  });
}
