import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import type { FastifyPluginAsync } from 'fastify';

export const ingredientRoutes: FastifyPluginAsync = async (app) => {
	const typed = app.withTypeProvider<TypeBoxTypeProvider>();
	void typed;
};
