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
  request: FastifyRequest<{ Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new ProductService(request.server);
  const companyId = request.query.company_id;
  if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
  const products = await service.getAllProducts(companyId);
  return reply.send(products);
};

export const updateProductHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: Partial<CreateProductInput>; Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new ProductService(request.server);
  const { id } = request.params;
  const companyId = request.query.company_id;
  if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
  try {
    const product = await service.updateProduct(parseInt(id), request.body, companyId);
    return reply.send(product);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};
