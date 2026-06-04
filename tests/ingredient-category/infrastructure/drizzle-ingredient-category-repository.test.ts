import { describe, expect, test } from 'vitest';
import {
	CategoryInUse,
	CategoryNameConflict,
	CategoryNotFound,
} from '../../../src/ingredient-category/domain/errors.js';
import { DrizzleIngredientCategoryRepository } from '../../../src/ingredient-category/infrastructure/drizzle-ingredient-category-repository.js';

const category = {
	id: '01907f00-0000-7000-8000-000000000001',
	name: 'Test Category',
};

function makeInsertRepo(
	returning: () => Promise<unknown>,
): DrizzleIngredientCategoryRepository {
	const mockDb = {
		insert: () => ({ values: () => ({ returning }) }),
	};
	return new DrizzleIngredientCategoryRepository(
		mockDb as unknown as ConstructorParameters<
			typeof DrizzleIngredientCategoryRepository
		>[0],
	);
}

function makeDeleteRepo(
	returning: () => Promise<unknown>,
): DrizzleIngredientCategoryRepository {
	const mockDb = {
		delete: () => ({
			where: () => ({ returning }),
		}),
		select: () => ({
			from: () => ({
				where: () => Promise.resolve([{ id: category.id }]),
			}),
		}),
	};
	return new DrizzleIngredientCategoryRepository(
		mockDb as unknown as ConstructorParameters<
			typeof DrizzleIngredientCategoryRepository
		>[0],
	);
}

describe('DrizzleIngredientCategoryRepository — insert error handling', () => {
	test('rethrows non-unique constraint errors', async () => {
		const repo = makeInsertRepo(() =>
			Promise.reject(new Error('connection reset')),
		);
		await expect(repo.insert(category)).rejects.toThrow('connection reset');
	});

	test('maps pg error 23505 to CategoryNameConflict', async () => {
		const err = Object.assign(new Error('duplicate key'), { code: '23505' });
		const repo = makeInsertRepo(() => Promise.reject(err));
		await expect(repo.insert(category)).rejects.toBeInstanceOf(
			CategoryNameConflict,
		);
	});
});

describe('DrizzleIngredientCategoryRepository — update error handling', () => {
	function makeUpdateRepo(
		returning: () => Promise<unknown>,
	): DrizzleIngredientCategoryRepository {
		const mockDb = {
			update: () => ({
				set: () => ({
					where: () => ({ returning }),
				}),
			}),
		};
		return new DrizzleIngredientCategoryRepository(
			mockDb as unknown as ConstructorParameters<
				typeof DrizzleIngredientCategoryRepository
			>[0],
		);
	}

	test('rethrows non-unique constraint errors during update', async () => {
		const repo = makeUpdateRepo(() =>
			Promise.reject(new Error('connection reset')),
		);
		await expect(
			repo.update(category.id, { name: 'New Name' }),
		).rejects.toThrow('connection reset');
	});

	test('throws CategoryNotFound when update affects no rows (race condition)', async () => {
		const repo = makeUpdateRepo(() => Promise.resolve([]));
		await expect(
			repo.update(category.id, { name: 'New Name' }),
		).rejects.toBeInstanceOf(CategoryNotFound);
	});
});

describe('DrizzleIngredientCategoryRepository — delete error handling', () => {
	test('rethrows non-FK constraint errors during delete', async () => {
		const repo = makeDeleteRepo(() =>
			Promise.reject(new Error('network error')),
		);
		await expect(repo.delete(category.id)).rejects.toThrow('network error');
	});

	test('maps pg error 23503 to CategoryInUse', async () => {
		const err = Object.assign(new Error('foreign key violation'), {
			code: '23503',
		});
		const repo = makeDeleteRepo(() => Promise.reject(err));
		await expect(repo.delete(category.id)).rejects.toBeInstanceOf(
			CategoryInUse,
		);
	});

	test('throws CategoryNotFound when delete affects no rows (race condition)', async () => {
		const repo = makeDeleteRepo(() => Promise.resolve([]));
		await expect(repo.delete(category.id)).rejects.toBeInstanceOf(
			CategoryNotFound,
		);
	});
});
