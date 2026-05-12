import { FastifyInstance } from 'fastify';
import { createEntitySchema, updateEntitySchema } from './entities.schema';
import { createEntityHandler, getEntitiesHandler, updateEntityHandler } from './entities.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function entityRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createEntitySchema },
  }, createEntityHandler);

  server.get('/', getEntitiesHandler);

  server.put('/:id', {
    schema: { body: updateEntitySchema },
  }, updateEntityHandler);
}
