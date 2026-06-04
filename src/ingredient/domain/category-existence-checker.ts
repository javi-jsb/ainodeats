/**
 * Consumer-owned port: the ingredient slice only needs to know whether a
 * referenced category id exists (interface segregation). An adapter in
 * infrastructure satisfies it by delegating to the category slice. The
 * database foreign key remains the authoritative atomic backstop —
 * see constitution v1.2.0 "Aggregate References".
 */
export interface CategoryExistenceChecker {
	exists(id: string): Promise<boolean>;
}
