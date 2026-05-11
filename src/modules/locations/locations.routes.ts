import { FastifyInstance } from 'fastify';
import { createLocationSchema } from './locations.schema';
import { createLocationHandler, getLocationsHandler } from './locations.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function locationRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createLocationSchema },
  }, createLocationHandler);

  server.get('/', getLocationsHandler);
}
