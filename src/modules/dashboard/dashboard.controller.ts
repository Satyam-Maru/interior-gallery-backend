import { FastifyReply, FastifyRequest } from 'fastify';
import { DashboardService } from './dashboard.service';

export const getDashboardStatsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new DashboardService(request.server);
  try {
    const stats = await service.getStats();
    return reply.send(stats);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch dashboard statistics' });
  }
};
