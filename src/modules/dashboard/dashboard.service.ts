import { FastifyInstance } from 'fastify';

export class DashboardService {
  constructor(private fastify: FastifyInstance) {}

  async getStats() {
    const { supabase } = this.fastify;

    // 1. Total Stock (Sum of all product quantities)
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('quantity');

    if (prodError) throw prodError;
    const totalStock = products.reduce((acc, p) => acc + (parseFloat(p.quantity) || 0), 0);

    // 2. Stock transactions
    const { data: stock, error: stockError } = await supabase
      .from('stock')
      .select('type, quantity, price, discount');

    if (stockError) throw stockError;

    let totalPurchases = 0;
    let totalSales = 0;
    const historyCount = stock.length;

    stock.forEach(item => {
      const qty = parseFloat(item.quantity);
      const price = parseFloat(item.price);
      const discount = parseFloat(item.discount || 0);
      const total = (qty * price) * (1 - (discount / 100));

      if (item.type === 'purchase') {
        totalPurchases += total;
      } else if (item.type === 'sell') {
        totalSales += total;
      }
    });

    // 3. Sales & Purchase Trend (Last 7 Days)
    const last7Days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    const { data: trendData, error: trendError } = await supabase
      .from('stock')
      .select('type, quantity, price, discount, created_at')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (trendError) throw trendError;

    const dailyTrend = last7Days.map(date => {
      let sales = 0;
      let purchases = 0;
      
      trendData.forEach(item => {
        const itemDate = item.created_at.split('T')[0];
        if (itemDate === date) {
          const total = (parseFloat(item.quantity) * parseFloat(item.price)) * (1 - (parseFloat(item.discount || 0) / 100));
          if (item.type === 'sell') sales += total;
          else purchases += total;
        }
      });

      return { date, sales, purchases };
    });

    // 4. Category Distribution
    const { data: catData, error: catError } = await supabase
      .from('products')
      .select('quantity, category(name)');

    if (catError) throw catError;

    const categoryDistribution: Record<string, number> = {};
    catData.forEach(item => {
      // Supabase might return category as an object or an array depending on schema relations
      const category: any = Array.isArray(item.category) ? item.category[0] : item.category;
      const catName = category?.name || 'Uncategorized';
      categoryDistribution[catName] = (categoryDistribution[catName] || 0) + parseFloat(item.quantity);
    });

    return {
      totalStock,
      totalPurchases,
      totalSales,
      historyCount,
      dailyTrend,
      categoryDistribution: Object.entries(categoryDistribution).map(([name, value]) => ({ name, value }))
    };
  }
}
