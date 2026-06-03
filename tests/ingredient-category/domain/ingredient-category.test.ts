import { describe, expect, test } from 'vitest';
import {
	normalizeCategoryFields,
	ValidationError,
} from '../../../src/ingredient-category/domain/ingredient-category.js';

describe('normalizeCategoryFields', () => {
	test('trims leading/trailing whitespace', () => {
		const result = normalizeCategoryFields({ name: '  Dairy  ' });
		expect(result).toEqual({ name: 'Dairy' });
	});

	test('throws ValidationError when name is empty after trimming', () => {
		expect(() => normalizeCategoryFields({ name: '   ' })).toThrow(
			ValidationError,
		);
	});

	test('throws ValidationError when name exceeds 100 characters', () => {
		expect(() => normalizeCategoryFields({ name: 'a'.repeat(101) })).toThrow(
			ValidationError,
		);
	});

	test('throws ValidationError when name contains a control character', () => {
		expect(() => normalizeCategoryFields({ name: 'Dair\x00y' })).toThrow(
			ValidationError,
		);
	});

	test('throws ValidationError when name contains a line break', () => {
		expect(() => normalizeCategoryFields({ name: 'Dai\nry' })).toThrow(
			ValidationError,
		);
	});
});
