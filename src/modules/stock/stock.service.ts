import { FastifyInstance } from 'fastify';
import { CreateBillInput, CreatePaymentInput, GetBillsQuery } from './stock.schema';

export class BillService {
  constructor(private fastify: FastifyInstance) {}

  // -------------------------------------------------------------------------
  // Utility: apply sequential percentage discounts to an amount
  // e.g. amount=1000, discounts=[10,5] → 1000 * 0.90 * 0.95 = 855
  // -------------------------------------------------------------------------
  private applyDiscounts(amount: number, discounts: number[]): number {
    return discounts.reduce((acc, pct) => acc * (1 - pct / 100), amount);
  }

  // -------------------------------------------------------------------------
  // Create Bill (purchase | sell | purchase_return | sell_return)
  // -------------------------------------------------------------------------
  async createBill(data: CreateBillInput) {
    const { supabase } = this.fastify;
    const partyId = (data.party_id ?? data.entity_id)!;

    // --- Validate return references original bill ---
    let originalBillRecord: any = null;
    if (
      (data.type === 'purchase_return' || data.type === 'sell_return') &&
      !data.original_bill_id
    ) {
      throw new Error('original_bill_id is required for return transactions.');
    }

    if (data.original_bill_id) {
      const { data: originalBill, error: origError } = await supabase
        .from('bills')
        .select('id, type, party_id, bill_items(*, products(name))')
        .eq('id', data.original_bill_id)
        .single();

      if (origError || !originalBill) {
        throw new Error(`Original bill #${data.original_bill_id} not found.`);
      }

      originalBillRecord = originalBill;

      // Validate return type matches original bill type
      const expectedOriginal =
        data.type === 'purchase_return' ? 'purchase' : 'sell';
      if (originalBill.type !== expectedOriginal) {
        throw new Error(
          `Cannot create ${data.type} against a '${originalBill.type}' bill.`
        );
      }

      // Validate party matches original bill's party
      if (partyId !== originalBill.party_id) {
        throw new Error(
          `Party ID ${partyId} does not match original bill's party (ID ${originalBill.party_id}).`
        );
      }

      // Query all existing return bills for this original bill
      const { data: prevReturns, error: prevRetError } = await supabase
        .from('bills')
        .select('id, bill_items(product_id, quantity)')
        .eq('original_bill_id', data.original_bill_id);

      if (prevRetError) throw prevRetError;

      const alreadyReturnedMap = new Map<number, number>();
      for (const ret of prevReturns ?? []) {
        for (const bi of (ret.bill_items as any[]) ?? []) {
          const prev = alreadyReturnedMap.get(bi.product_id) || 0;
          alreadyReturnedMap.set(bi.product_id, prev + Number(bi.quantity));
        }
      }

      // Map original bill items by product_id
      const origItemMap = new Map<number, any>(
        (originalBill.bill_items ?? []).map((bi: any) => [bi.product_id, bi])
      );

      // Validate every item in this return bill against original bill items
      for (const item of data.items) {
        const origItem = origItemMap.get(item.product_id);
        if (!origItem) {
          throw new Error(
            `Product ID ${item.product_id} was not in original bill #${data.original_bill_id}. Only original bill items can be returned.`
          );
        }

        const alreadyReturned = alreadyReturnedMap.get(item.product_id) || 0;
        const availableToReturn = Number(origItem.quantity) - alreadyReturned;

        if (item.quantity > availableToReturn + 0.0001) {
          const prodName = origItem.products?.name || `Product #${item.product_id}`;
          throw new Error(
            `Cannot return ${item.quantity} units of "${prodName}". Maximum returnable is ${availableToReturn} (Original: ${origItem.quantity}, Already returned: ${alreadyReturned}).`
          );
        }
      }
    }

    // --- Fetch all products in one query ---
    const productIds = data.items.map((i) => i.product_id);
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('id, quantity, name')
      .in('id', productIds);

    if (prodError) throw prodError;

    const productMap = new Map<number, { quantity: number; name: string }>(
      (products ?? []).map((p: any) => [
        p.id,
        { quantity: Number(p.quantity), name: p.name },
      ])
    );

    // Verify all requested products exist
    for (const item of data.items) {
      if (!productMap.has(item.product_id)) {
        throw new Error(`Product ID ${item.product_id} not found.`);
      }
    }

    // --- Stock validation for outgoing transactions ---
    const isStockOut =
      data.type === 'sell' || data.type === 'purchase_return';

    if (isStockOut) {
      for (const item of data.items) {
        const product = productMap.get(item.product_id)!;
        if (product.quantity < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${product.quantity}, Requested: ${item.quantity}`
          );
        }
      }
    }

    // --- Compute totals ---
    const itemsWithSubtotal = data.items.map((item) => ({
      ...item,
      sub_total: item.quantity * item.price,
    }));

    const totalAmount = itemsWithSubtotal.reduce(
      (acc, i) => acc + i.sub_total,
      0
    );
    const netAmount = this.applyDiscounts(totalAmount, data.discounts);

    // --- Insert bill ---
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .insert({
        type: data.type,
        party_id: partyId,
        original_bill_id: data.original_bill_id ?? null,
        bill_date: data.bill_date ?? new Date().toISOString(),
        total_amount: totalAmount,
        discounts: data.discounts,
        net_amount: netAmount,
        note: data.note ?? null,
      })
      .select()
      .single();

    if (billError) throw billError;

    // --- Insert bill items ---
    const billItemsPayload = itemsWithSubtotal.map((item) => ({
      bill_id: bill.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: item.price,
      sub_total: item.sub_total,
    }));

    const { error: itemsError } = await supabase
      .from('bill_items')
      .insert(billItemsPayload);

    if (itemsError) {
      // Rollback: delete the bill (cascade deletes items)
      await supabase.from('bills').delete().eq('id', bill.id);
      throw itemsError;
    }

    // --- Update product quantities ---
    const quantityUpdates: Promise<any>[] = data.items.map((item) =>
      (async () => {
        const current = productMap.get(item.product_id)!.quantity;
        let newQty: number;

        if (data.type === 'purchase' || data.type === 'sell_return') {
          newQty = current + item.quantity; // stock in
        } else {
          newQty = current - item.quantity; // stock out
        }

        return supabase
          .from('products')
          .update({ quantity: newQty })
          .eq('id', item.product_id);
      })()
    );

    const updateResults = await Promise.all(quantityUpdates);
    const updateError = updateResults.find((r) => r.error)?.error;

    if (updateError) {
      // Rollback: delete bill (cascades to bill_items)
      await supabase.from('bills').delete().eq('id', bill.id);
      throw new Error(
        'Failed to update product quantities. Transaction rolled back.'
      );
    }

    // --- Return bill with items ---
    const { data: fullBill, error: fullBillError } = await supabase
      .from('bills')
      .select(
        `*, parties(name), bill_items(*, products(name))`
      )
      .eq('id', bill.id)
      .single();

    if (fullBillError) throw fullBillError;
    return fullBill;
  }

  // -------------------------------------------------------------------------
  // List bills with optional filters
  // -------------------------------------------------------------------------
  async getBills(filters?: GetBillsQuery) {
    let query = this.fastify.supabase
      .from('bills')
      .select(
        `*, parties(*), bill_items(*, products(*))`
      )
      .order('bill_date', { ascending: false });

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }
    const partyFilter = filters?.party_id ?? filters?.entity_id;
    if (partyFilter) {
      query = query.eq('party_id', partyFilter);
    }
    if (filters?.startDate) {
      query = query.gte('bill_date', filters.startDate);
    }
    if (filters?.endDate) {
      query = query.lte('bill_date', filters.endDate);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Fetch all returns to map return counts and totals by original_bill_id
    const { data: allReturns } = await this.fastify.supabase
      .from('bills')
      .select('id, original_bill_id, net_amount')
      .not('original_bill_id', 'is', null);

    const returnsByOrigId = new Map<number, { total: number; count: number }>();
    for (const ret of allReturns ?? []) {
      if (ret.original_bill_id) {
        const curr = returnsByOrigId.get(ret.original_bill_id) || { total: 0, count: 0 };
        curr.total += Number(ret.net_amount);
        curr.count += 1;
        returnsByOrigId.set(ret.original_bill_id, curr);
      }
    }

    const enrichedBills = (data ?? []).map((b: any) => {
      const retInfo = returnsByOrigId.get(b.id) || { total: 0, count: 0 };
      const adjusted = Math.max(0, Number(b.net_amount) - retInfo.total);
      return {
        ...b,
        total_returned: retInfo.total,
        return_count: retInfo.count,
        adjusted_net_amount: adjusted,
      };
    });

    return enrichedBills;
  }

  // -------------------------------------------------------------------------
  // Get single bill with items + payments + outstanding
  // -------------------------------------------------------------------------
  async getBillById(id: number) {
    const { supabase } = this.fastify;

    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select(
        `*, parties(*), bill_items(*, products(*)), payments(*)`
      )
      .eq('id', id)
      .single();

    if (billError || !bill) throw new Error(`Bill #${id} not found.`);

    // Query all return bills linked to this bill
    const { data: returnBills, error: retError } = await supabase
      .from('bills')
      .select('id, bill_date, type, total_amount, discounts, net_amount, note, bill_items(*, products(*))')
      .eq('original_bill_id', id)
      .order('bill_date', { ascending: false });

    if (retError) throw retError;

    // Calculate cumulative returned quantity per product
    const returnedQtyMap = new Map<number, number>();
    const totalReturned = (returnBills ?? []).reduce(
      (acc: number, rb: any) => {
        for (const bi of rb.bill_items ?? []) {
          const prev = returnedQtyMap.get(bi.product_id) || 0;
          returnedQtyMap.set(bi.product_id, prev + Number(bi.quantity));
        }
        return acc + Number(rb.net_amount);
      },
      0
    );

    // Annotate original bill items with returned and returnable quantities
    const annotatedItems = (bill.bill_items ?? []).map((item: any) => {
      const returnedQty = returnedQtyMap.get(item.product_id) || 0;
      const returnableQty = Math.max(0, Number(item.quantity) - returnedQty);
      return {
        ...item,
        returned_quantity: returnedQty,
        returnable_quantity: returnableQty,
      };
    });

    const totalPaid = (bill.payments ?? []).reduce(
      (acc: number, p: any) => acc + Number(p.amount),
      0
    );

    // Effective amount of the bill adjusted for returns (non-destructive reference)
    const adjustedNetAmount = Math.max(0, Number(bill.net_amount) - totalReturned);
    const outstanding = Math.max(0, adjustedNetAmount - totalPaid);

    return {
      ...bill,
      bill_items: annotatedItems,
      return_bills: returnBills ?? [],
      total_returned: totalReturned,
      adjusted_net_amount: adjustedNetAmount,
      total_paid: totalPaid,
      outstanding,
    };
  }

  // -------------------------------------------------------------------------
  // Record a payment against a bill
  // -------------------------------------------------------------------------
  async createPayment(data: CreatePaymentInput) {
    const { supabase } = this.fastify;
    const partyId = data.party_id ?? data.entity_id;

    // Fetch bill to validate outstanding
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('id, net_amount, party_id')
      .eq('id', data.bill_id)
      .single();

    if (billError || !bill) {
      throw new Error(`Bill #${data.bill_id} not found.`);
    }

    // Sum existing payments
    const { data: existingPayments, error: payError } = await supabase
      .from('payments')
      .select('amount')
      .eq('bill_id', data.bill_id);

    if (payError) throw payError;

    // Query return bills to calculate adjusted net amount
    const { data: returnBills } = await supabase
      .from('bills')
      .select('net_amount')
      .eq('original_bill_id', data.bill_id);

    const totalReturned = (returnBills ?? []).reduce(
      (acc: number, rb: any) => acc + Number(rb.net_amount),
      0
    );

    const alreadyPaid = (existingPayments ?? []).reduce(
      (acc: number, p: any) => acc + Number(p.amount),
      0
    );
    const adjustedNetAmount = Math.max(0, Number(bill.net_amount) - totalReturned);
    const outstanding = Math.max(0, adjustedNetAmount - alreadyPaid);

    if (data.amount > outstanding + 0.001) {
      throw new Error(
        `Payment amount ₹${data.amount} exceeds outstanding balance ₹${outstanding.toFixed(2)} (Bill: ₹${Number(bill.net_amount).toFixed(2)}, Returns: ₹${totalReturned.toFixed(2)}).`
      );
    }

    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        bill_id: data.bill_id,
        party_id: partyId ?? bill.party_id,
        amount: data.amount,
        mode: data.mode,
        paid_at: data.paid_at ?? new Date().toISOString(),
        note: data.note ?? null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return payment;
  }

  // -------------------------------------------------------------------------
  // Get outstanding balance for a specific party
  // -------------------------------------------------------------------------
  async getOutstandingByParty(partyId: number) {
    const { supabase } = this.fastify;

    const { data: bills, error: billsError } = await supabase
      .from('bills')
      .select('id, type, net_amount')
      .eq('party_id', partyId);

    if (billsError) throw billsError;

    const billIds = (bills ?? []).map((b: any) => b.id);

    let totalPaid = 0;
    if (billIds.length > 0) {
      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .in('bill_id', billIds);

      if (payError) throw payError;
      totalPaid = (payments ?? []).reduce(
        (acc: number, p: any) => acc + Number(p.amount),
        0
      );
    }

    const totalBilled = (bills ?? []).reduce(
      (acc: number, b: any) => acc + Number(b.net_amount),
      0
    );

    return {
      party_id: partyId,
      total_billed: totalBilled,
      total_paid: totalPaid,
      outstanding: totalBilled - totalPaid,
    };
  }

  async getOutstandingByEntity(entityId: number) {
    return this.getOutstandingByParty(entityId);
  }
}
