import { FastifyReply, FastifyRequest } from 'fastify';
import { LocationService } from './locations.service';
import { CreateLocationInput } from './locations.schema';

export const createLocationHandler = async (
  request: FastifyRequest<{ Body: CreateLocationInput }>,
  reply: FastifyReply
) => {
  const service = new LocationService(request.server);
  try {
    const location = await service.createLocation(request.body);
    return reply.code(201).send(location);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const getLocationsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new LocationService(request.server);
  const locations = await service.getAllLocations();
  return reply.send(locations);
};
