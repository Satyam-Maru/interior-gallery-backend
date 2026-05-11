import { FastifyInstance } from 'fastify';
import { createStockSchema } from './stock.schema';
import { createStockHandler, getStockHistoryHandler } from './stock.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function stockRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: {
      body: createStockSchema,
    },
  }, createStockHandler);

  server.get('/', getStockHistoryHandler);
}
