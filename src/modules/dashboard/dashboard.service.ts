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
    const totalStock = products.reduce(
      (acc: number, p: any) => acc + (parseFloat(p.quantity) || 0),
      0
    );

    // 2. Bills summary — purchases, sales, returns
    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, type, net_amount, bill_date');

    if (billsError) throw billsError;

    let totalPurchases = 0;
    let totalSales = 0;
    let totalPurchaseReturns = 0;
    let totalSellReturns = 0;

    (bills ?? []).forEach((bill: any) => {
      const amount = parseFloat(bill.net_amount) || 0;
      if (bill.type === 'purchase') totalPurchases += amount;
      else if (bill.type === 'sell') totalSales += amount;
      else if (bill.type === 'purchase_return') totalPurchaseReturns += amount;
      else if (bill.type === 'sell_return') totalSellReturns += amount;
    });

    const billIds = (bills ?? []).map((b: any) => b.id);

    // 3. Total paid across all bills
    let totalPaid = 0;
    if (billIds.length > 0) {
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .in('bill_id', billIds);

      if (payError) throw payError;
      totalPaid = (payments ?? []).reduce(
        (acc: number, p: any) => acc + (parseFloat(p.amount) || 0),
        0
      );
    }

    // Total outstanding across all parties: total billed minus total payments
    const totalBilled = totalPurchases + totalSellReturns + totalSales + totalPurchaseReturns;
    const totalOutstanding = totalBilled - totalPaid;

    // 4. Sales & Purchase Trend (Last 7 Days)
    const last7Days = [...Array(7)]
      .map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      })
      .reverse();

    const { data: trendData, error: trendError } = await supabase
      .from('bills')
      .select('type, net_amount, bill_date')
      .gte(
        'bill_date',
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      );

    if (trendError) throw trendError;

    const dailyTrend = last7Days.map((date) => {
      let sales = 0;
      let purchases = 0;

      (trendData ?? []).forEach((bill: any) => {
        const billDate = bill.bill_date.split('T')[0];
        if (billDate === date) {
          const amount = parseFloat(bill.net_amount) || 0;
          if (bill.type === 'sell' || bill.type === 'sell_return') {
            sales += amount;
          } else {
            purchases += amount;
          }
        }
      });

      return { date, sales, purchases };
    });

    // 5. Category Distribution (by product quantity)
    const { data: catData, error: catError } = await supabase
      .from('products')
      .select('quantity, category(name)');

    if (catError) throw catError;

    const categoryDistribution: Record<string, number> = {};
    (catData ?? []).forEach((item: any) => {
      const category: any = Array.isArray(item.category)
        ? item.category[0]
        : item.category;
      const catName = category?.name || 'Uncategorized';
      categoryDistribution[catName] =
        (categoryDistribution[catName] || 0) + parseFloat(item.quantity);
    });

    return {
      totalStock,
      totalPurchases,
      totalSales,
      totalPurchaseReturns,
      totalSellReturns,
      totalOutstanding,
      billCount: (bills ?? []).length,
      dailyTrend,
      categoryDistribution: Object.entries(categoryDistribution).map(
        ([name, value]) => ({ name, value })
      ),
    };
  }
}
