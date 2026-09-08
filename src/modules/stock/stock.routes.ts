import { FastifyInstance } from 'fastify';
import { ZodTypeProvider } from 'fastify-type-provider-zod';
import {
  createBillSchema,
  createPaymentSchema,
  getBillsQuerySchema,
} from './stock.schema';
import {
  createBillHandler,
  getBillsHandler,
  getBillByIdHandler,
  createPaymentHandler,
  getOutstandingHandler,
} from './stock.controller';

export default async function billRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  // POST /api/v1/bills — create a purchase, sell, or return bill
  server.post('/', {
    schema: { body: createBillSchema },
  }, createBillHandler);

  // GET /api/v1/bills — list bills with optional filters
  server.get('/', {
    schema: { querystring: getBillsQuerySchema },
  }, getBillsHandler);

  // GET /api/v1/bills/:id — get a single bill with items, payments & outstanding
  server.get('/:id', getBillByIdHandler);

  // POST /api/v1/bills/payments — record a payment against a bill
  server.post('/payments', {
    schema: { body: createPaymentSchema },
  }, createPaymentHandler);

  // GET /api/v1/bills/outstanding/:partyId — get outstanding for a party
  server.get('/outstanding/:partyId', getOutstandingHandler);
  server.get('/outstanding/entity/:entityId', getOutstandingHandler);
}
