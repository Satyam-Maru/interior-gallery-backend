import { FastifyReply, FastifyRequest } from 'fastify';
import { CategoryService } from './category.service';
import { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

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
  request: FastifyRequest<{ Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new CategoryService(request.server);
  const companyId = request.query.company_id;
  if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
  const categories = await service.getAllCategories(companyId);
  return reply.send(categories);
};

export const updateCategoryHandler = async (
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryInput; Querystring: { company_id: string } }>,
  reply: FastifyReply
) => {
  const service = new CategoryService(request.server);
  const companyId = request.query.company_id;
  if (!companyId) return reply.code(400).send({ error: 'company_id is required' });
  try {
    const category = await service.updateCategory(Number(request.params.id), request.body, companyId);
    return reply.send(category);
  } catch (error: any) {
    return reply.code(400).send({ error: error.message });
  }
};
