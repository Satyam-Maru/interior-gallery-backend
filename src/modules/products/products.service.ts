import { FastifyInstance } from 'fastify';
import { CreateProductInput } from './products.schema';

export class ProductService {
  constructor(private fastify: FastifyInstance) {}

  async createProduct(data: CreateProductInput & { company_id: string }) {
    const { data: product, error } = await this.fastify.supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return product;
  }

  async getAllProducts(companyId: string) {
    const { data, error } = await this.fastify.supabase
      .from('products')
      .select('*, category(name)')
      .eq('company_id', companyId)
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateProduct(id: number, data: Partial<CreateProductInput>, companyId: string) {
    const { data: product, error } = await this.fastify.supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;
    return product;
  }
}
