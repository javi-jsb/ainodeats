import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import { healthRoute } from '../../health/infrastructure/health.route.js';
import {
	IngredientNameConflict,
	IngredientNotFound,
} from '../../ingredient/domain/errors.js';
import { ingredientRoutes } from '../../ingredient/infrastructure/ingredient-routes.js';
import { dbPlugin } from './db.js';

export async function buildApp(): Promise<FastifyInstance> {
	const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

	await app.register(fastifySwagger, {
		openapi: {
			info: { title: 'ainodeats', version: '0.0.1' },
		},
	});
	await app.register(fastifySwaggerUi, { routePrefix: '/docs' });
	await app.register(dbPlugin);
	await app.register(healthRoute);
	await app.register(ingredientRoutes);

	app.setErrorHandler((error: FastifyError | Error, _request, reply) => {
		if ('validation' in error && error.validation) {
			return reply.status(400).send({
				statusCode: 400,
				error: 'Bad Request',
				message: error.message,
			});
		}
		if (error instanceof IngredientNotFound) {
			return reply.status(404).send({
				statusCode: 404,
				error: 'Not Found',
				message: error.message,
			});
		}
		if (error instanceof IngredientNameConflict) {
			return reply.status(409).send({
				statusCode: 409,
				error: 'Conflict',
				message: error.message,
			});
		}
		app.log.error(error);
		return reply.status(500).send({
			statusCode: 500,
			error: 'Internal Server Error',
			message: 'An unexpected error occurred',
		});
	});

	return app;
}
