import { FastifyInstance } from 'fastify';
import { CreateCategoryInput } from './category.schema';

export class CategoryService {
  constructor(private fastify: FastifyInstance) {}

  async createCategory(data: CreateCategoryInput) {
    const { data: category, error } = await this.fastify.supabase
      .from('category')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return category;
  }

  async getAllCategories() {
    const { data, error } = await this.fastify.supabase
      .from('category')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateCategory(id: number, data: { name: string }) {
    const { data: category, error } = await this.fastify.supabase
      .from('category')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return category;
  }
}
