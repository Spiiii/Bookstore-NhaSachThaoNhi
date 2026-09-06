/** HTTP query integers use canonical positive decimal notation, not JS numeric coercion. */
export function queryInteger(value: unknown): unknown {
  return typeof value === 'string' && /^[1-9][0-9]*$(?![\s\S])/.test(value) ? Number(value) : value;
}

export function trimmedQuery(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Prisma PostgreSQL contains uses LIKE/ILIKE; preserve literal %, _ and backslash searches. */
export function literalSearch(value: string | undefined): string | undefined {
  const text = value?.trim();
  return text ? text.replace(/[\\%_]/g, (character) => `\\${character}`) : undefined;
}
