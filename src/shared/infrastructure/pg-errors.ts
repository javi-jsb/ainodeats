/**
 * Named PostgreSQL SQLSTATE codes we react to, so call sites read by intent
 * rather than by opaque numeric strings. See
 * https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PgErrorCode = {
	UniqueViolation: '23505',
	ForeignKeyViolation: '23503',
} as const;

export type PgErrorCode = (typeof PgErrorCode)[keyof typeof PgErrorCode];

/**
 * Returns true if `err` (or any error in its `cause` chain) is a PostgreSQL
 * error carrying the given SQLSTATE `code`. Walking the cause chain keeps it
 * robust to drivers that wrap the underlying database error.
 */
export function hasPgCode(err: unknown, code: PgErrorCode): boolean {
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
