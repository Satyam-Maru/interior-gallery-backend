import { FastifyInstance } from 'fastify';
import { getDashboardStatsHandler } from './dashboard.controller';

export default async function dashboardRoutes(fastify: FastifyInstance) {
  fastify.get('/stats', getDashboardStatsHandler);
}
