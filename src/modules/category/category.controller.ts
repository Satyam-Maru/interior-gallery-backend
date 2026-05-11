import { FastifyReply, FastifyRequest } from 'fastify';
import { CategoryService } from './category.service';
import { CreateCategoryInput } from './category.schema';

export const createCategoryHandler = async (
  request: FastifyRequest<{ Body: CreateCategoryInput }>,
  reply: FastifyReply
) => {
  const service = new CategoryService(request.server);
  try {
    const category = await service.createCategory(request.body);
    return reply.code(201).send(category);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};

export const getCategoriesHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const service = new CategoryService(request.server);
  const categories = await service.getAllCategories();
  return reply.send(categories);
};
