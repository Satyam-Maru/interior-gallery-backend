import { FastifyInstance } from 'fastify';
import { CreateLocationInput } from './locations.schema';

export class LocationService {
  constructor(private fastify: FastifyInstance) {}

  async createLocation(data: CreateLocationInput) {
    const { data: location, error } = await this.fastify.supabase
      .from('locations')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return location;
  }

  async getAllLocations() {
    const { data, error } = await this.fastify.supabase
      .from('locations')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateLocation(id: number, data: { name: string }) {
    const { data: location, error } = await this.fastify.supabase
      .from('locations')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return location;
  }
}
