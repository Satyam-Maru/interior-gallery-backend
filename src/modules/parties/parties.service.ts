import { FastifyInstance } from 'fastify';
import { CreatePartyInput, UpdatePartyInput } from './parties.schema';

export class PartyService {
  constructor(private fastify: FastifyInstance) {}

  async createParty(data: CreatePartyInput) {
    const { data: party, error } = await this.fastify.supabase
      .from('parties')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return party;
  }

  async getAllParties() {
    const { data, error } = await this.fastify.supabase
      .from('parties')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateParty(id: number, data: UpdatePartyInput) {
    const { data: party, error } = await this.fastify.supabase
      .from('parties')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return party;
  }

  async deleteParty(id: number) {
    const { data, error } = await this.fastify.supabase
      .from('parties')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return data;
  }
}
