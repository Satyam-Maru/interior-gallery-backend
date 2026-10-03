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

  async getAllCategories(companyId: string) {
    const { data, error } = await this.fastify.supabase
      .from('category')
      .select('*')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateCategory(id: number, data: { name: string }, companyId: string) {
    const { data: category, error } = await this.fastify.supabase
      .from('category')
      .update(data)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return category;
  }
}
