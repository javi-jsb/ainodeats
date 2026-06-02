import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import fp from 'fastify-plugin';
import pg from 'pg';
import { getDatabaseUrl } from './config.js';

declare module 'fastify' {
	interface FastifyInstance {
		db: NodePgDatabase;
	}
}

export const dbPlugin = fp(async (app) => {
	const pool = new pg.Pool({ connectionString: getDatabaseUrl() });
	const db = drizzle(pool);
	app.decorate('db', db);
	app.addHook('onClose', async () => {
		await pool.end();
	});
});
