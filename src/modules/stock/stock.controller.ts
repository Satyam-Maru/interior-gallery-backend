import { FastifyReply, FastifyRequest } from 'fastify';
import { StockService } from './stock.service';
import { CreateStockInput } from './stock.schema';

export const createStockHandler = async (
  request: FastifyRequest<{ Body: CreateStockInput }>,
  reply: FastifyReply
) => {
  const service = new StockService(request.server);
  try {
    const stock = await service.createStockEntry(request.body);
    return reply.code(201).send(stock);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(400).send({ error: error.message });
  }
};

export const getStockHistoryHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new StockService(request.server);
  try {
    const history = await service.getStockHistory();
    return reply.send(history);
  } catch (error: any) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Failed to fetch stock history' });
  }
};
