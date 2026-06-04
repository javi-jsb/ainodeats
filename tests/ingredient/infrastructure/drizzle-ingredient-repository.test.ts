import { describe, expect, test } from 'vitest';
import {
	CategoryReferenceNotFound,
	IngredientNameConflict,
} from '../../../src/ingredient/domain/errors.js';
import { DrizzleIngredientRepository } from '../../../src/ingredient/infrastructure/drizzle-ingredient-repository.js';

const CATEGORY_ID = '01907f00-0000-7000-8000-000000000001';

function makeRepo(
	returning: () => Promise<unknown>,
): DrizzleIngredientRepository {
	const mockDb = {
		insert: () => ({
			values: () => ({ returning }),
		}),
		update: () => ({
			set: () => ({
				where: () => ({ returning }),
			}),
		}),
		select: () => ({
			from: () => ({
				where: () => Promise.resolve([{ name: 'Test Category' }]),
			}),
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
	categoryId: CATEGORY_ID,
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

	test('maps direct pg error with code 23503 to CategoryReferenceNotFound', async () => {
		const pgFkError = Object.assign(new Error('foreign key violation'), {
			code: '23503',
		});
		const repo = makeRepo(() => Promise.reject(pgFkError));
		await expect(repo.insert(ingredient)).rejects.toBeInstanceOf(
			CategoryReferenceNotFound,
		);
	});
});

describe('DrizzleIngredientRepository — update error handling', () => {
	// The application-layer pre-check normally rejects an unknown categoryId
	// before update reaches the DB, so the FK backstop is only hit on a TOCTOU
	// race. Exercise it directly to keep the guarantee covered.
	test('maps direct pg error with code 23503 to CategoryReferenceNotFound', async () => {
		const pgFkError = Object.assign(new Error('foreign key violation'), {
			code: '23503',
		});
		const repo = makeRepo(() => Promise.reject(pgFkError));
		await expect(
			repo.update(ingredient.id, { categoryId: CATEGORY_ID }),
		).rejects.toBeInstanceOf(CategoryReferenceNotFound);
	});
});
