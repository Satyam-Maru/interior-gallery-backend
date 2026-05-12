import { FastifyInstance } from 'fastify';
import { createLocationSchema, updateLocationSchema } from './locations.schema';
import { createLocationHandler, getLocationsHandler, updateLocationHandler } from './locations.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function locationRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createLocationSchema },
  }, createLocationHandler);

  server.get('/', getLocationsHandler);

  server.put('/:id', {
    schema: { body: updateLocationSchema },
  }, updateLocationHandler);
}
