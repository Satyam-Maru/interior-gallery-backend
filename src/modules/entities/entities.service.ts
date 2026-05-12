import { FastifyInstance } from 'fastify';
import { CreateEntityInput } from './entities.schema';

export class EntityService {
  constructor(private fastify: FastifyInstance) {}

  async createEntity(data: CreateEntityInput) {
    const { data: entity, error } = await this.fastify.supabase
      .from('entities')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return entity;
  }

  async getAllEntities() {
    const { data, error } = await this.fastify.supabase
      .from('entities')
      .select('*, locations(name)')
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateEntity(id: number, data: any) {
    const { data: entity, error } = await this.fastify.supabase
      .from('entities')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return entity;
  }
}
