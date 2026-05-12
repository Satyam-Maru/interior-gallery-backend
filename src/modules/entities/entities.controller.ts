import { FastifyReply, FastifyRequest } from 'fastify';
import { EntityService } from './entities.service';
import { CreateEntityInput } from './entities.schema';

export const createEntityHandler = async (
  request: FastifyRequest<{ Body: CreateEntityInput }>,
  reply: FastifyReply
) => {
  const service = new EntityService(request.server);
  try {
    const entity = await service.createEntity(request.body);
    return reply.code(201).send(entity);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const getEntitiesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new EntityService(request.server);
  const entities = await service.getAllEntities();
  return reply.send(entities);
};

export const updateEntityHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: any }>,
  reply: FastifyReply
) => {
  const service = new EntityService(request.server);
  try {
    const entity = await service.updateEntity(parseInt(request.params.id), request.body);
    return reply.send(entity);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};
