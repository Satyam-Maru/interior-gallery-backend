import { FastifyInstance } from 'fastify';
import { createCategorySchema } from './category.schema';
import { createCategoryHandler, getCategoriesHandler } from './category.controller';
import { ZodTypeProvider } from 'fastify-type-provider-zod';

export default async function categoryRoutes(fastify: FastifyInstance) {
  const server = fastify.withTypeProvider<ZodTypeProvider>();

  server.post('/', {
    schema: { body: createCategorySchema },
  }, createCategoryHandler);

  server.get('/', getCategoriesHandler);
}
