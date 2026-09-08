import { FastifyReply, FastifyRequest } from 'fastify';
import { PartyService } from './parties.service';
import { CreatePartyInput, UpdatePartyInput } from './parties.schema';

export const createPartyHandler = async (
  request: FastifyRequest<{ Body: CreatePartyInput }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const party = await service.createParty(request.body);
    return reply.code(201).send(party);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const getPartiesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const parties = await service.getAllParties();
    return reply.send(parties);
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
};

export const updatePartyHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdatePartyInput }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const party = await service.updateParty(parseInt(request.params.id), request.body);
    return reply.send(party);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const deletePartyHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    await service.deleteParty(parseInt(request.params.id));
    return reply.code(204).send();
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};
