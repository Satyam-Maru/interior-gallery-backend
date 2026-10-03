import { FastifyInstance } from 'fastify';
import { CreatePartyInput, UpdatePartyInput } from './parties.schema';

export class PartyService {
  constructor(private fastify: FastifyInstance) {}

  async createParty(data: CreatePartyInput & { company_id: string }) {
    const { data: party, error } = await this.fastify.supabase
      .from('parties')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return party;
  }

  async getAllParties(companyId: string) {
    const { data, error } = await this.fastify.supabase
      .from('parties')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateParty(id: number, data: UpdatePartyInput, companyId: string) {
    const { data: party, error } = await this.fastify.supabase
      .from('parties')
      .update(data)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return party;
  }

  async deleteParty(id: number, companyId: string) {
    const { data, error } = await this.fastify.supabase
      .from('parties')
      .delete()
      .eq('id', id)
      .eq('company_id', companyId);

    if (error) throw error;
    return data;
  }
}
