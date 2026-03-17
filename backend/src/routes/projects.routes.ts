import { FastifyInstance } from 'fastify';
import { verifyToken, createClerkClient } from '@clerk/backend';
import { prisma } from '../lib/prisma';

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });

export async function clerkAuth(req: any, reply: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' });
  const token = authHeader.slice(7);
  try {
    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY!,
    });
    req.clerkUserId = payload.sub;

    // Upsert user
    let user = await prisma.user.findUnique({ where: { clerkId: payload.sub } });
    if (!user) {
      const clerkUser = await clerk.users.getUser(payload.sub);
      user = await prisma.user.create({
        data: {
          clerkId: payload.sub,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        },
      });
    }
    req.user = user;
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export async function projectsRoutes(fastify: FastifyInstance) {
  // POST /api/projects
  fastify.post('/projects', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { name } = req.body as { name: string };
    if (!name) return reply.status(400).send({ error: 'Project name required' });

    const project = await prisma.project.create({
      data: { userId: req.user.id, name },
    });
    return reply.status(201).send({ project });
  });

  // GET /api/projects
  fastify.get('/projects', { preHandler: clerkAuth }, async (req: any, reply) => {
    const projects = await prisma.project.findMany({
      where: { userId: req.user.id },
      include: {
        _count: { select: { payments: true, apiKeys: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { projects };
  });

  // GET /api/projects/:id
  fastify.get('/projects/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const project = await prisma.project.findFirst({ where: { id, userId: req.user.id } });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return { project };
  });

  // PUT /api/projects/:id
  fastify.put('/projects/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    const { name } = req.body as { name: string };
    await prisma.project.updateMany({ where: { id, userId: req.user.id }, data: { name } });
    return { success: true };
  });

  // DELETE /api/projects/:id
  fastify.delete('/projects/:id', { preHandler: clerkAuth }, async (req: any, reply) => {
    const { id } = req.params as { id: string };
    await prisma.project.deleteMany({ where: { id, userId: req.user.id } });
    return { success: true };
  });
}
