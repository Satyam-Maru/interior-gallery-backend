import { FastifyInstance } from 'fastify';
import { PartyService } from '../parties/parties.service';

export * from '../parties/parties.service';

export class EntityService extends PartyService {
  constructor(fastify: FastifyInstance) {
    super(fastify);
  }

  async getAllEntities() {
    return this.getAllParties();
  }

  async createEntity(data: any) {
    return this.createParty(data);
  }

  async updateEntity(id: number, data: any) {
    return this.updateParty(id, data);
  }
}
