import { FastifyInstance } from 'fastify';
import { CreateProductInput } from './products.schema';

export class ProductService {
  constructor(private fastify: FastifyInstance) {}

  async createProduct(data: CreateProductInput) {
    const { data: product, error } = await this.fastify.supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    return product;
  }

  async getAllProducts() {
    const { data, error } = await this.fastify.supabase
      .from('products')
      .select('*, category(name)')
      .order('name');

    if (error) throw error;
    return data;
  }

  async updateProduct(id: number, data: Partial<CreateProductInput>) {
    const { data: product, error } = await this.fastify.supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return product;
  }
}
