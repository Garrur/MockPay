import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export async function apiKeyAuth(req: FastifyRequest, reply: FastifyReply) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Missing Bearer token' });
  }

  const token = authHeader.slice(7);

  // Find all active keys and check hash match
  const keys = await prisma.apiKey.findMany({
    where: { isActive: true },
    include: { project: true },
  });

  let matchedKey = null;
  for (const key of keys) {
    const hash = crypto.createHash('sha256').update(token).digest('hex');
    if (hash === key.secretKeyHash) {
      matchedKey = key;
      break;
    }
  }

  if (!matchedKey) {
    return reply.status(401).send({ error: 'Unauthorized', message: 'Invalid API key' });
  }

  // Attach project to request context
  (req as any).project = matchedKey.project;
  (req as any).apiKey = matchedKey;
}
