export class CategoryNotFound extends Error {
	readonly statusCode = 404;

	constructor(public readonly id: string) {
		super(`Ingredient category with id "${id}" not found`);
		this.name = 'CategoryNotFound';
	}
}

export class CategoryNameConflict extends Error {
	readonly statusCode = 409;

	constructor(public readonly conflictingName: string) {
		super(`An ingredient category named "${conflictingName}" already exists`);
		this.name = 'CategoryNameConflict';
	}
}

export class CategoryInUse extends Error {
	readonly statusCode = 409;

	constructor(public readonly id: string) {
		super(
			`Ingredient category with id "${id}" is in use by one or more ingredients`,
		);
		this.name = 'CategoryInUse';
	}
}
