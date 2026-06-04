import { type Static, Type } from '@sinclair/typebox';

export const IngredientCategorySchema = Type.Object(
	{
		id: Type.String({ format: 'uuid' }),
		name: Type.String({ minLength: 1, maxLength: 100 }),
	},
	{ additionalProperties: false },
);

export const NewIngredientCategorySchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 100 }),
	},
	{ additionalProperties: false },
);

export const UpdateIngredientCategorySchema = Type.Object(
	{
		name: Type.String({ minLength: 1, maxLength: 100 }),
	},
	{ additionalProperties: false },
);

export const CategoryIdParamSchema = Type.Object({
	id: Type.String({ format: 'uuid' }),
});

export const IngredientCategoryListSchema = Type.Array(
	IngredientCategorySchema,
);

export type IngredientCategoryDto = Static<typeof IngredientCategorySchema>;
export type NewIngredientCategoryDto = Static<
	typeof NewIngredientCategorySchema
>;
export type UpdateIngredientCategoryDto = Static<
	typeof UpdateIngredientCategorySchema
>;
export type CategoryIdParam = Static<typeof CategoryIdParamSchema>;
