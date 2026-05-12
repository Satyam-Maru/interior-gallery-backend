import { FastifyInstance } from 'fastify';
import { createCategorySchema, updateCategorySchema } from './category.schema';
import { createCategoryHandler, getCategoriesHandler, updateCategoryHandler } from './category.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function categoryRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createCategorySchema },
  }, createCategoryHandler);

  server.get('/', getCategoriesHandler);

  server.put('/:id', {
    schema: { body: updateCategorySchema },
  }, updateCategoryHandler);
}
