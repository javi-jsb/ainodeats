import { describe, expect, test } from 'vitest';
import { IngredientNameConflict } from '../../../src/ingredient/domain/errors.js';
import { DrizzleIngredientRepository } from '../../../src/ingredient/infrastructure/drizzle-ingredient-repository.js';

function makeRepo(
	returning: () => Promise<unknown>,
): DrizzleIngredientRepository {
	const mockDb = {
		insert: () => ({
			values: () => ({ returning }),
		}),
	};
	return new DrizzleIngredientRepository(
		mockDb as unknown as ConstructorParameters<
			typeof DrizzleIngredientRepository
		>[0],
	);
}

const ingredient = {
	id: '01907f00-0000-7000-8000-000000000000',
	name: 'Test',
	unit: 'g',
	category: 'test',
	createdAt: new Date(),
	updatedAt: new Date(),
};

describe('DrizzleIngredientRepository — insert error handling', () => {
	test('rethrows non-unique constraint errors', async () => {
		const repo = makeRepo(() => Promise.reject(new Error('connection reset')));
		await expect(repo.insert(ingredient)).rejects.toThrow('connection reset');
	});

	test('maps direct pg error with code 23505 to IngredientNameConflict', async () => {
		const pgUniqueError = Object.assign(new Error('duplicate key'), {
			code: '23505',
		});
		const repo = makeRepo(() => Promise.reject(pgUniqueError));
		await expect(repo.insert(ingredient)).rejects.toBeInstanceOf(
			IngredientNameConflict,
		);
	});
});
