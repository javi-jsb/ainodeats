import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';
import Fastify, {
	type FastifyError,
	type FastifyInstance,
	type FastifyReply,
	type FastifyRequest,
} from 'fastify';
import { healthRoute } from '../../health/infrastructure/health.route.js';
import { ingredientRoutes } from '../../ingredient/infrastructure/ingredient-routes.js';
import { ingredientCategoryRoutes } from '../../ingredient-category/infrastructure/ingredient-category-routes.js';
import { dbPlugin } from './db.js';

export function handleError(
	error: (FastifyError | Error) & { statusCode?: number },
	_request: FastifyRequest,
	reply: FastifyReply,
): void {
	if ('validation' in error && error.validation) {
		reply.status(400).send({
			statusCode: 400,
			error: 'Bad Request',
			message: error.message,
		});
		return;
	}
	const status = error.statusCode;
	if (status === 400) {
		reply.status(400).send({
			statusCode: 400,
			error: 'Bad Request',
			message: error.message,
		});
		return;
	}
	if (status === 404) {
		reply.status(404).send({
			statusCode: 404,
			error: 'Not Found',
			message: error.message,
		});
		return;
	}
	if (status === 409) {
		reply.status(409).send({
			statusCode: 409,
			error: 'Conflict',
			message: error.message,
		});
		return;
	}
	if (status === 422) {
		reply.status(422).send({
			statusCode: 422,
			error: 'Unprocessable Entity',
			message: error.message,
		});
		return;
	}
	reply.log.error(error);
	reply.status(500).send({
		statusCode: 500,
		error: 'Internal Server Error',
		message: 'An unexpected error occurred',
	});
}

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
	await app.register(ingredientCategoryRoutes);
	await app.register(ingredientRoutes);

	app.setErrorHandler(handleError);

	return app;
}
