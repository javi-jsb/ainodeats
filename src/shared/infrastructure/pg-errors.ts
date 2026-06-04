/**
 * Returns true if `err` (or any error in its `cause` chain) is a PostgreSQL
 * error carrying the given SQLSTATE `code` (e.g. '23505' unique violation,
 * '23503' foreign-key violation). Walking the cause chain keeps it robust to
 * drivers that wrap the underlying database error.
 */
export function hasPgCode(err: unknown, code: string): boolean {
	if (
		typeof err === 'object' &&
		err !== null &&
		'code' in err &&
		(err as { code: string }).code === code
	) {
		return true;
	}
	if (typeof err === 'object' && err !== null && 'cause' in err) {
		return hasPgCode((err as { cause: unknown }).cause, code);
	}
	return false;
}
