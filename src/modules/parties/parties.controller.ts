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
  request: FastifyRequest<{ Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const companyId = request.query.company_id;
    if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
    const parties = await service.getAllParties(companyId);
    return reply.send(parties);
  } catch (error: any) {
    return reply.code(500).send({ error: error.message });
  }
};

export const updatePartyHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdatePartyInput; Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const companyId = request.query.company_id;
    if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
    const party = await service.updateParty(parseInt(request.params.id), request.body, companyId);
    return reply.send(party);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const deletePartyHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new PartyService(request.server);
  try {
    const companyId = request.query.company_id;
    if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
    await service.deleteParty(parseInt(request.params.id), companyId);
    return reply.code(204).send();
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};
