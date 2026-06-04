import { type Static, Type } from '@sinclair/typebox';
import { IngredientCategorySchema } from '../../ingredient-category/infrastructure/ingredient-category-schemas.js';

export const IngredientSchema = Type.Object(
	{
		id: Type.String({ format: 'uuid' }),
		name: Type.String({ minLength: 1, maxLength: 100 }),
		unit: Type.String({ minLength: 1, maxLength: 50 }),
		category: IngredientCategorySchema,
		createdAt: Type.String({ format: 'date-time' }),
		updatedAt: Type.String({ format: 'date-time' }),
	},
	{ additionalProperties: false },
);

export const NewIngredientSchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 100 }),
		unit: Type.String({ minLength: 1, maxLength: 50 }),
		categoryId: Type.String({ format: 'uuid' }),
	},
	{ additionalProperties: false },
);

export const UpdateIngredientSchema = Type.Object(
	{
		name: Type.Optional(Type.String({ minLength: 1, maxLength: 100 })),
		unit: Type.Optional(Type.String({ minLength: 1, maxLength: 50 })),
		categoryId: Type.Optional(Type.String({ format: 'uuid' })),
	},
	{ additionalProperties: false, minProperties: 1 },
);

export const IdParamSchema = Type.Object({
	id: Type.String({ format: 'uuid' }),
});

export const ListQuerySchema = Type.Object({
	categoryId: Type.Optional(Type.String({ format: 'uuid' })),
	name: Type.Optional(Type.String({ maxLength: 100 })),
});

export const IngredientListSchema = Type.Array(IngredientSchema);

export type IngredientDto = Static<typeof IngredientSchema>;
export type NewIngredientDto = Static<typeof NewIngredientSchema>;
export type UpdateIngredientDto = Static<typeof UpdateIngredientSchema>;
export type IdParam = Static<typeof IdParamSchema>;
export type ListQuery = Static<typeof ListQuerySchema>;
