import { describe, expect, test } from 'vitest';
import {
	normalizeIngredientFields,
	normalizePartialFields,
	ValidationError,
} from '../../../src/ingredient/domain/ingredient.js';

describe('normalizeIngredientFields', () => {
	test('trims leading/trailing whitespace', () => {
		const result = normalizeIngredientFields({
			name: '  Tomato  ',
			unit: ' g ',
			category: ' vegetable ',
		});
		expect(result).toEqual({
			name: 'Tomato',
			unit: 'g',
			category: 'vegetable',
		});
	});

	test('throws ValidationError when name exceeds maxLength after trim', () => {
		expect(() =>
			normalizeIngredientFields({
				name: 'a'.repeat(101),
				unit: 'g',
				category: 'veg',
			}),
		).toThrow(ValidationError);
	});

	test('throws ValidationError when unit exceeds maxLength after trim', () => {
		expect(() =>
			normalizeIngredientFields({
				name: 'Tomato',
				unit: 'u'.repeat(51),
				category: 'veg',
			}),
		).toThrow(ValidationError);
	});

	test('throws ValidationError when category exceeds maxLength after trim', () => {
		expect(() =>
			normalizeIngredientFields({
				name: 'Tomato',
				unit: 'g',
				category: 'c'.repeat(51),
			}),
		).toThrow(ValidationError);
	});
});

describe('normalizePartialFields', () => {
	test('skips undefined fields', () => {
		const result = normalizePartialFields({ unit: '  kg  ' });
		expect(result).toEqual({ unit: 'kg' });
		expect(result.name).toBeUndefined();
		expect(result.category).toBeUndefined();
	});

	test('normalizes all provided fields including category', () => {
		const result = normalizePartialFields({
			name: '  Tomato  ',
			unit: '  g  ',
			category: '  vegetable  ',
		});
		expect(result).toEqual({
			name: 'Tomato',
			unit: 'g',
			category: 'vegetable',
		});
	});
});
