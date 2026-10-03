import { FastifyReply, FastifyRequest } from 'fastify';
import { BillService } from './stock.service';
import {
  CreateBillInput,
  UpdateBillInput,
  CreatePaymentInput,
  GetBillsQuery,
} from './stock.schema';

// ---------------------------------------------------------------------------
// Create a new bill (purchase / sell / purchase_return / sell_return)
// ---------------------------------------------------------------------------
export const createBillHandler = async (
  request: FastifyRequest<{ Body: CreateBillInput }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const bill = await service.createBill(request.body);
    return reply.code(201).send(bill);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(400).send({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// List bills with optional filters
// ---------------------------------------------------------------------------
export const getBillsHandler = async (
  request: FastifyRequest<{ Querystring: GetBillsQuery }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const bills = await service.getBills(request.query);
    return reply.send(bills);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch bills' });
  }
};

// ---------------------------------------------------------------------------
// Get a single bill by ID (includes items, payments, outstanding)
// ---------------------------------------------------------------------------
export const getBillByIdHandler = async (
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const bill = await service.getBillById(Number(request.params.id));
    return reply.send(bill);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(404).send({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Update an existing bill
// ---------------------------------------------------------------------------
export const updateBillHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBillInput }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const bill = await service.updateBill(Number(request.params.id), request.body);
    return reply.send(bill);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(400).send({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Record a payment against an existing bill
// ---------------------------------------------------------------------------
export const createPaymentHandler = async (
  request: FastifyRequest<{ Body: CreatePaymentInput }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const payment = await service.createPayment(request.body);
    return reply.code(201).send(payment);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(400).send({ error: error.message });
  }
};

// ---------------------------------------------------------------------------
// Get outstanding balance for a specific party
// ---------------------------------------------------------------------------
export const getOutstandingHandler = async (
  request: FastifyRequest<{ Params: { partyId?: string; entityId?: string }; Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new BillService(request.server);
  try {
    const id = Number(request.params.partyId ?? request.params.entityId);
    const companyId = request.query.company_id;
    if (!companyId) {
      return reply.code(400).send({ error: 'company_id query parameter is required' });
    }
    const result = await service.getOutstandingByParty(id, companyId);
    return reply.send(result);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch outstanding balance' });
  }
};
