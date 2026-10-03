import { FastifyReply, FastifyRequest } from 'fastify';
import { DashboardService } from './dashboard.service';

export const getDashboardStatsHandler = async (
  request: FastifyRequest<{ Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new DashboardService(request.server);
  try {
    const companyId = request.query.company_id;
    if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
    const stats = await service.getStats(companyId);
    return reply.send(stats);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch dashboard statistics' });
  }
};
