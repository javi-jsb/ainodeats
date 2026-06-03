import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsync } from 'fastify';
import { createIngredientCategory } from '../application/create-ingredient-category.js';
import { deleteIngredientCategory } from '../application/delete-ingredient-category.js';
import { getIngredientCategory } from '../application/get-ingredient-category.js';
import { listIngredientCategories } from '../application/list-ingredient-categories.js';
import { updateIngredientCategory } from '../application/update-ingredient-category.js';
import { DrizzleIngredientCategoryRepository } from './drizzle-ingredient-category-repository.js';
import {
	CategoryIdParamSchema,
	IngredientCategoryListSchema,
	IngredientCategorySchema,
	NewIngredientCategorySchema,
	UpdateIngredientCategorySchema,
} from './ingredient-category-schemas.js';

export const ingredientCategoryRoutes: FastifyPluginAsync = async (app) => {
	const typed = app.withTypeProvider<TypeBoxTypeProvider>();

	typed.post(
		'/ingredient-categories',
		{
			schema: {
				body: NewIngredientCategorySchema,
				response: { 201: IngredientCategorySchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientCategoryRepository(request.server.db);
			const category = await createIngredientCategory(repo, request.body);
			return reply.status(201).send(category);
		},
	);

	typed.get(
		'/ingredient-categories',
		{
			schema: {
				response: { 200: IngredientCategoryListSchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientCategoryRepository(request.server.db);
			const categories = await listIngredientCategories(repo);
			return reply.send(categories);
		},
	);

	typed.get(
		'/ingredient-categories/:id',
		{
			schema: {
				params: CategoryIdParamSchema,
				response: { 200: IngredientCategorySchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientCategoryRepository(request.server.db);
			const category = await getIngredientCategory(repo, request.params.id);
			return reply.send(category);
		},
	);

	typed.patch(
		'/ingredient-categories/:id',
		{
			schema: {
				params: CategoryIdParamSchema,
				body: UpdateIngredientCategorySchema,
				response: { 200: IngredientCategorySchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientCategoryRepository(request.server.db);
			const category = await updateIngredientCategory(
				repo,
				request.params.id,
				request.body,
			);
			return reply.send(category);
		},
	);

	typed.delete(
		'/ingredient-categories/:id',
		{
			schema: {
				params: CategoryIdParamSchema,
				response: { 204: Type.Null() },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientCategoryRepository(request.server.db);
			await deleteIngredientCategory(repo, request.params.id);
			return reply.status(204).send(null);
		},
	);
};
