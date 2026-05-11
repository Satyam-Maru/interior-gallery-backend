import { FastifyReply, FastifyRequest } from 'fastify';
import { ProductService } from './products.service';
import { CreateProductInput } from './products.schema';

export const createProductHandler = async (
  request: FastifyRequest<{ Body: CreateProductInput }>,
  reply: FastifyReply
) => {
  const service = new ProductService(request.server);
  try {
    const product = await service.createProduct(request.body);
    return reply.code(201).send(product);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const getProductsHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new ProductService(request.server);
  const products = await service.getAllProducts();
  return reply.send(products);
};
