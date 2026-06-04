import { describe, expect, test } from 'vitest';
import {
	normalizeIngredientFields,
	normalizePartialFields,
	ValidationError,
} from '../../../src/ingredient/domain/ingredient.js';

const CATEGORY_ID = '01907f00-0000-7000-8000-000000000001';

describe('normalizeIngredientFields', () => {
	test('trims leading/trailing whitespace from name and unit', () => {
		const result = normalizeIngredientFields({
			name: '  Tomato  ',
			unit: ' g ',
			categoryId: CATEGORY_ID,
		});
		expect(result).toEqual({
			name: 'Tomato',
			unit: 'g',
			categoryId: CATEGORY_ID,
		});
	});

	test('throws ValidationError when name exceeds maxLength after trim', () => {
		expect(() =>
			normalizeIngredientFields({
				name: 'a'.repeat(101),
				unit: 'g',
				categoryId: CATEGORY_ID,
			}),
		).toThrow(ValidationError);
	});

	test('throws ValidationError when unit exceeds maxLength after trim', () => {
		expect(() =>
			normalizeIngredientFields({
				name: 'Tomato',
				unit: 'u'.repeat(51),
				categoryId: CATEGORY_ID,
			}),
		).toThrow(ValidationError);
	});

	test('passes categoryId through without validation', () => {
		const result = normalizeIngredientFields({
			name: 'Tomato',
			unit: 'g',
			categoryId: CATEGORY_ID,
		});
		expect(result.categoryId).toBe(CATEGORY_ID);
	});
});

describe('normalizePartialFields', () => {
	test('skips undefined fields', () => {
		const result = normalizePartialFields({ unit: '  kg  ' });
		expect(result).toEqual({ unit: 'kg' });
		expect(result.name).toBeUndefined();
		expect(result.categoryId).toBeUndefined();
	});

	test('normalizes name and unit; passes categoryId through', () => {
		const result = normalizePartialFields({
			name: '  Tomato  ',
			unit: '  g  ',
			categoryId: CATEGORY_ID,
		});
		expect(result).toEqual({
			name: 'Tomato',
			unit: 'g',
			categoryId: CATEGORY_ID,
		});
	});
});
