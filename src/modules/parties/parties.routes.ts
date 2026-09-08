import { FastifyInstance } from 'fastify';
import { createPartySchema, updatePartySchema } from './parties.schema';
import {
  createPartyHandler,
  getPartiesHandler,
  updatePartyHandler,
  deletePartyHandler,
} from './parties.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function partyRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createPartySchema },
  }, createPartyHandler);

  server.get('/', getPartiesHandler);

  server.put('/:id', {
    schema: { body: updatePartySchema },
  }, updatePartyHandler);

  server.delete('/:id', deletePartyHandler);
}
