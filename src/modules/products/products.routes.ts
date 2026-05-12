import { FastifyInstance } from 'fastify';
import { createProductSchema } from './products.schema';
import { createProductHandler, getProductsHandler, updateProductHandler } from './products.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function productRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createProductSchema },
  }, createProductHandler);

  server.get('/', getProductsHandler);

  server.put('/:id', updateProductHandler);
}
