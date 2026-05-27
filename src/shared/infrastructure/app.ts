import Fastify, { type FastifyInstance } from 'fastify';
import { healthRoute } from '../../health/infrastructure/health.route.js';

export async function buildApp(): Promise<FastifyInstance> {
	const app = Fastify({ logger: true });
	await app.register(healthRoute);
	return app;
}
