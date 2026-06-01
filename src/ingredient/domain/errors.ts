export class IngredientNotFound extends Error {
	constructor(public readonly id: string) {
		super(`Ingredient with id "${id}" not found`);
		this.name = 'IngredientNotFound';
	}
}

export class IngredientNameConflict extends Error {
	constructor(public readonly conflictingName: string) {
		super(`An ingredient named "${conflictingName}" already exists`);
		this.name = 'IngredientNameConflict';
	}
}
