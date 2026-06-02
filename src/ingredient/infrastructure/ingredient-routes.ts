import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import { Type } from '@sinclair/typebox';
import type { FastifyPluginAsync } from 'fastify';
import { createIngredient } from '../application/create-ingredient.js';
import { deleteIngredient } from '../application/delete-ingredient.js';
import { getIngredient } from '../application/get-ingredient.js';
import { listIngredients } from '../application/list-ingredients.js';
import { updateIngredient } from '../application/update-ingredient.js';
import { DrizzleIngredientRepository } from './drizzle-ingredient-repository.js';
import {
	IdParamSchema,
	IngredientListSchema,
	IngredientSchema,
	ListQuerySchema,
	NewIngredientSchema,
	UpdateIngredientSchema,
} from './ingredient-schemas.js';

function toDto(ingredient: {
	id: string;
	name: string;
	unit: string;
	category: string;
	createdAt: Date;
	updatedAt: Date;
}) {
	return {
		...ingredient,
		createdAt: ingredient.createdAt.toISOString(),
		updatedAt: ingredient.updatedAt.toISOString(),
	};
}

export const ingredientRoutes: FastifyPluginAsync = async (app) => {
	const typed = app.withTypeProvider<TypeBoxTypeProvider>();

	typed.post(
		'/ingredients',
		{
			schema: {
				body: NewIngredientSchema,
				response: { 201: IngredientSchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientRepository(request.server.db);
			const ingredient = await createIngredient(repo, request.body);
			return reply.status(201).send(toDto(ingredient));
		},
	);

	typed.get(
		'/ingredients/:id',
		{
			schema: {
				params: IdParamSchema,
				response: { 200: IngredientSchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientRepository(request.server.db);
			const ingredient = await getIngredient(repo, request.params.id);
			return reply.send(toDto(ingredient));
		},
	);

	typed.get(
		'/ingredients',
		{
			schema: {
				querystring: ListQuerySchema,
				response: { 200: IngredientListSchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientRepository(request.server.db);
			const items = await listIngredients(repo, {
				category: request.query.category,
				name: request.query.name,
			});
			return reply.send(items.map(toDto));
		},
	);

	typed.patch(
		'/ingredients/:id',
		{
			schema: {
				params: IdParamSchema,
				body: UpdateIngredientSchema,
				response: { 200: IngredientSchema },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientRepository(request.server.db);
			const ingredient = await updateIngredient(
				repo,
				request.params.id,
				request.body,
			);
			return reply.send(toDto(ingredient));
		},
	);

	typed.delete(
		'/ingredients/:id',
		{
			schema: {
				params: IdParamSchema,
				response: { 204: Type.Null() },
			},
		},
		async (request, reply) => {
			const repo = new DrizzleIngredientRepository(request.server.db);
			await deleteIngredient(repo, request.params.id);
			return reply.status(204).send(null);
		},
	);
};
