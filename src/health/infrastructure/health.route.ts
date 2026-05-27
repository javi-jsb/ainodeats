import type { FastifyPluginAsync } from 'fastify';

export const healthRoute: FastifyPluginAsync = async (app) => {
	app.get(
		'/health',
		{
			schema: {
				response: {
					200: {
						type: 'object',
						required: ['status'],
						properties: {
							status: { type: 'string', enum: ['ok'] },
						},
					},
				},
			},
		},
		async () => ({ status: 'ok' }),
	);
};
