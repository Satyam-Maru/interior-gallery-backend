import { FastifyInstance } from 'fastify';
import { CreateStockInput } from './stock.schema';

export class StockService {
  constructor(private fastify: FastifyInstance) {}

  async createStockEntry(data: CreateStockInput) {
    const { supabase } = this.fastify;

    // 1. Fetch current product quantity
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('quantity')
      .eq('id', data.product_id)
      .single();

    if (fetchError || !product) {
      throw new Error('Product not found');
    }

    const currentQty = Number(product.quantity);
    let newQty = currentQty;

    // 2. Logic for Stock In/Out
    if (data.type === 'purchase') {
      newQty += data.quantity;
    } else if (data.type === 'sell') {
      if (currentQty < data.quantity) {
        throw new Error(`Insufficient stock. Available: ${currentQty}`);
      }
      newQty -= data.quantity;
    }

    // 3. Insert Stock Record
    const { data: stockEntry, error: stockError } = await supabase
      .from('stock')
      .insert({
        type: data.type,
        quantity: data.quantity,
        price: data.price,
        discount: data.discount,
        product_id: data.product_id,
        entity_id: data.entity_id,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (stockError) throw stockError;

    // 4. Update Product Quantity
    const { error: updateError } = await supabase
      .from('products')
      .update({ quantity: newQty })
      .eq('id', data.product_id);

    if (updateError) {
      // Manual rollback of stock entry if product update fails
      await supabase.from('stock').delete().eq('id', stockEntry.id);
      throw new Error('Failed to update product quantity. Transaction rolled back.');
    }

    return stockEntry;
  }

  async getStockHistory(filters?: { startDate?: string; endDate?: string; productId?: string; entityId?: string }) {
    let query = this.fastify.supabase
      .from('stock')
      .select(`
        *,
        products (name),
        entities (name)
      `);

    if (filters?.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters?.productId) {
      query = query.eq('product_id', filters.productId);
    }
    if (filters?.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }
}
