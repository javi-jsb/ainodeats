import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const TEST_DB = 'ainodeats_test';
const BASE_URL =
	process.env.DATABASE_URL ??
	'postgres://ainodeats:ainodeats@localhost:5432/ainodeats';

function buildUrl(db: string): string {
	const url = new URL(BASE_URL);
	url.pathname = `/${db}`;
	return url.toString();
}

export async function setup(): Promise<void> {
	const adminPool = new pg.Pool({ connectionString: buildUrl('postgres') });
	try {
		const result = await adminPool.query(
			`SELECT 1 FROM pg_database WHERE datname = $1`,
			[TEST_DB],
		);
		if (result.rowCount === 0) {
			await adminPool.query(`CREATE DATABASE ${TEST_DB}`);
		}
	} finally {
		await adminPool.end();
	}

	const migrationsFolder = join(
		dirname(fileURLToPath(import.meta.url)),
		'../../drizzle',
	);

	const testPool = new pg.Pool({ connectionString: buildUrl(TEST_DB) });
	try {
		const db = drizzle(testPool);
		await migrate(db, { migrationsFolder });
	} finally {
		await testPool.end();
	}

	process.env.DATABASE_URL = buildUrl(TEST_DB);
}
